import { createClient } from "@/lib/supabase/server"
import { HeaderClient } from "@/components/header-client"
import { signOut } from "@/app/actions/auth"

type HeaderProps = {
  withSidebar?: boolean
}

export async function Header({ withSidebar }: HeaderProps) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  const displayName = user?.user_metadata?.full_name || user?.email
  const email = user?.email ?? null
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    null

  return (
    <HeaderClient
      avatarUrl={avatarUrl}
      displayName={displayName ?? null}
      email={email}
      isLoggedIn={Boolean(user)}
      onSignOut={signOut}
      userId={user?.id ?? null}
      withSidebar={withSidebar}
    />
  )
}
