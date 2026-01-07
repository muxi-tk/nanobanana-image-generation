import Link from "next/link"
import { signOut } from "@/app/actions/auth"
import { AuthMenu } from "@/components/auth-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  const displayName = user?.user_metadata?.full_name || user?.email

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto px-4 max-w-7xl flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-4xl">🍌</span>
          <span className="text-foreground">Nano Banana</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#generator"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Generator
          </Link>
          <Link
            href="#showcase"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Examples
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reviews
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="#generator">Start Editing</Link>
          </Button>

          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end max-w-[200px] truncate">
                <span className="text-xs text-muted-foreground">Signed in</span>
                <span className="text-sm font-semibold truncate">{displayName}</span>
              </div>
              <form action={signOut}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <AuthMenu />
          )}
        </div>
      </div>
    </header>
  )
}
