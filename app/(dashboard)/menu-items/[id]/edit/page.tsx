import { MenuItemForm } from "@/components/menu-items/menu-item-form"

interface EditMenuItemPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const { id } = await params

  return <MenuItemForm mode="edit" itemId={id} />
}
