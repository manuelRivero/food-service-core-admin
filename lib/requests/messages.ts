import { api } from "@/lib/api"

export const ADMIN_WHATSAPP_MESSAGES_PATH = "/admin/whatsapp/messages"

export interface AdminWhatsappCustomer {
  id: string
  name: string | null
  phoneNumber: string
}

export interface AdminWhatsappConversation {
  id: string
  botEnabled?: boolean
  customer: AdminWhatsappCustomer
}

export interface AdminWhatsappMessage {
  id: string
  sender: string
  message: string
  isAiGenerated: boolean
  createdAt: string
  conversation: AdminWhatsappConversation
}

export interface FetchAdminWhatsappMessagesParams {
  page?: number
  pageSize?: number
  conversationId?: string
  customerPhone?: string
}

interface AdminWhatsappMessageRaw {
  id?: string
  message_id?: string
  sender?: string | null
  message?: string | null
  text?: string | null
  is_ai_generated?: boolean | null
  isAiGenerated?: boolean | null
  created_at?: string | null
  createdAt?: string | null
  conversation?: {
    id?: string | null
    bot_enabled?: boolean | null
    botEnabled?: boolean | null
    customer?: {
      id?: string | null
      name?: string | null
      phone_number?: string | null
      phoneNumber?: string | null
    } | null
  } | null
}

interface AdminWhatsappMessagesListResponseRaw {
  items?: AdminWhatsappMessageRaw[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export interface AdminWhatsappMessagesListResponse {
  items: AdminWhatsappMessage[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface AdminWhatsappConversationBotStatusRaw {
  enabled?: boolean
  botEnabled?: boolean
}

interface AdminWhatsappSendMessageRaw {
  id?: string
  message_id?: string
}

function toNonEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function mapRawMessage(raw: AdminWhatsappMessageRaw): AdminWhatsappMessage {
  const rawBotEnabled =
    raw.conversation?.botEnabled ?? raw.conversation?.bot_enabled
  return {
    id: toNonEmpty(raw.id ?? raw.message_id),
    sender: toNonEmpty(raw.sender),
    message: toNonEmpty(raw.message ?? raw.text),
    isAiGenerated: Boolean(raw.isAiGenerated ?? raw.is_ai_generated),
    createdAt: toNonEmpty(raw.createdAt ?? raw.created_at),
    conversation: {
      id: toNonEmpty(raw.conversation?.id),
      botEnabled:
        typeof rawBotEnabled === "boolean" ? rawBotEnabled : undefined,
      customer: {
        id: toNonEmpty(raw.conversation?.customer?.id),
        name: raw.conversation?.customer?.name ?? null,
        phoneNumber: toNonEmpty(
          raw.conversation?.customer?.phoneNumber ??
            raw.conversation?.customer?.phone_number,
        ),
      },
    },
  }
}

export async function fetchAdminWhatsappMessages(
  params: FetchAdminWhatsappMessagesParams = {},
): Promise<AdminWhatsappMessagesListResponse> {
  const page = params.page ?? 1
  const pageSize = Math.min(params.pageSize ?? 20, 100)

  const { data } = await api.get<AdminWhatsappMessagesListResponseRaw>(
    ADMIN_WHATSAPP_MESSAGES_PATH,
    {
      params: {
        page,
        pageSize,
        ...(params.conversationId?.trim()
          ? { conversationId: params.conversationId.trim() }
          : {}),
        ...(params.customerPhone?.trim()
          ? { customerPhone: params.customerPhone.trim() }
          : {}),
      },
    },
  )

  return {
    items: Array.isArray(data.items) ? data.items.map(mapRawMessage) : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
    page: Number.isFinite(data.page) ? Number(data.page) : page,
    pageSize: Number.isFinite(data.pageSize) ? Number(data.pageSize) : pageSize,
    totalPages: Number.isFinite(data.totalPages) ? Number(data.totalPages) : 0,
  }
}

function adminWhatsappConversationBotPath(conversationId: string): string {
  return `/admin/whatsapp/conversations/${conversationId}/bot`
}

export async function fetchAdminWhatsappConversationBotStatus(
  conversationId: string,
): Promise<boolean> {
  const { data } = await api.get<AdminWhatsappConversationBotStatusRaw>(
    adminWhatsappConversationBotPath(conversationId),
  )
  return Boolean(data.botEnabled ?? data.enabled)
}

export async function patchAdminWhatsappConversationBotStatus(
  conversationId: string,
  enabled: boolean,
): Promise<boolean> {
  const { data } = await api.patch<AdminWhatsappConversationBotStatusRaw>(
    adminWhatsappConversationBotPath(conversationId),
    { enabled },
  )
  return Boolean(data.botEnabled ?? data.enabled ?? enabled)
}

function adminWhatsappConversationMessagesPath(conversationId: string): string {
  return `/admin/whatsapp/conversations/${conversationId}/messages`
}

export async function sendAdminWhatsappMessage(
  conversationId: string,
  message: string,
): Promise<{ id: string | null }> {
  const { data } = await api.post<AdminWhatsappSendMessageRaw>(
    adminWhatsappConversationMessagesPath(conversationId),
    { message },
  )
  const id = data.id ?? data.message_id ?? null
  return { id: typeof id === "string" && id.trim() ? id : null }
}
