import Image from "next/image"
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
          <Image
            src="/prism.png"
            alt="Nano Banana logo"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-foreground">Nano Banana</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#generator"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Generator
          </Link>
          <Link
            href="/#showcase"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Examples
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/support"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center max-w-[200px] truncate">
                <span className="text-sm font-semibold truncate">{displayName}</span>
              </div>
              <form action={signOut}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <AuthMenu />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
