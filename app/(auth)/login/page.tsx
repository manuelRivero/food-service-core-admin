"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { isAxiosError } from "axios"
import { LayoutDashboard } from "lucide-react"

import { resolveAccessToken, setAuthCookie } from "@/lib/auth"
import { login } from "@/lib/requests/login"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function safeRedirectPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/"
  return from
}

function LoginForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)
    try {
      const data = await login(values)
      const token = resolveAccessToken(data)
      if (!token) {
        setSubmitError("El servidor no devolvió un token de acceso.")
        return
      }
      setAuthCookie(token)
      const from =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("from")
          : null
      const dest = safeRedirectPath(from)
      router.push(dest)
      router.refresh()
    } catch (err) {
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string })?.message ??
          err.response?.statusText
        setSubmitError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudo iniciar sesión. Revisa credenciales o la URL del API.",
        )
        return
      }
      setSubmitError("Error inesperado. Inténtalo de nuevo.")
    }
  }

  function submitWithFallbackValues() {
    const email = emailInputRef.current?.value?.trim() ?? ""
    const password = passwordInputRef.current?.value ?? ""
    if (!email || !password) {
      setSubmitError("Completa correo y contraseña para continuar.")
      return
    }
    void onSubmit({ email, password })
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
          <LayoutDashboard className="size-6" />
        </div>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Accede al panel de administración con tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                const { ref, ...fieldProps } = field
                return (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="tu@empresa.com"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            void form.handleSubmit(onSubmit, submitWithFallbackValues)()
                          }
                        }}
                        {...fieldProps}
                        ref={(element) => {
                          ref(element)
                          emailInputRef.current = element
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const { ref, ...fieldProps } = field
                return (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            void form.handleSubmit(onSubmit, submitWithFallbackValues)()
                          }
                        }}
                        {...fieldProps}
                        ref={(element) => {
                          ref(element)
                          passwordInputRef.current = element
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            {submitError ? (
              <p className="text-center text-sm text-destructive" role="alert">
                {submitError}
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={form.formState.isSubmitting}
              onClick={() => {
                void form.handleSubmit(onSubmit, submitWithFallbackValues)()
              }}
              onTouchEnd={() => {
                void form.handleSubmit(onSubmit, submitWithFallbackValues)()
              }}
            >
              {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
