import { createClient } from "@/lib/supabase/server"
import { HeaderClient } from "@/components/header-client"
import { signOut } from "@/app/actions/auth"

export async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  const displayName = user?.user_metadata?.full_name || user?.email

  return (
    <HeaderClient
      displayName={displayName ?? null}
      isLoggedIn={Boolean(user)}
      onSignOut={signOut}
    />
  )
}
