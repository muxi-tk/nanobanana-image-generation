"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthMenu } from "@/components/auth-menu"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

type HeaderClientProps = {
  displayName: string | null
  isLoggedIn: boolean
  onSignOut: () => void
}

export function HeaderClient({ displayName, isLoggedIn, onSignOut }: HeaderClientProps) {
  const { t } = useI18n()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)
  const [hash, setHash] = useState("")

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash || "")
    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setCredits(null)
      return
    }
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" })
        if (!res.ok) {
          setCredits(null)
          return
        }
        const data = (await res.json().catch(() => null)) as { credits?: number } | null
        if (typeof data?.credits === "number") {
          setCredits(data.credits)
        } else {
          setCredits(10)
        }
      } catch {
        setCredits(null)
      }
    }
    fetchCredits()
  }, [isLoggedIn])

  useEffect(() => {
    const handleCreditsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ credits?: number }>).detail
      if (typeof detail?.credits === "number") {
        setCredits(detail.credits)
      }
    }
    window.addEventListener("nb:credits", handleCreditsUpdate)
    return () => window.removeEventListener("nb:credits", handleCreditsUpdate)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto px-4 max-w-7xl flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Logo className="h-9 w-9 text-foreground" />
          <span className="text-foreground">Nano Banana</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/generator"
            className={cn(
              "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/generator" &&
                "text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
            )}
          >
            {t("navGenerator")}
          </Link>
          <Link
            href="/#showcase"
            className={cn(
              "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/" &&
                hash === "#showcase" &&
                "text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
            )}
          >
            {t("navExamples")}
          </Link>
          <Link
            href="/pricing"
            className={cn(
              "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/pricing" &&
                "text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
            )}
          >
            {t("navPricing")}
          </Link>
          <Link
            href="/support"
            className={cn(
              "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/support" &&
                "text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
            )}
          >
            {t("navSupport")}
          </Link>
          <Link
            href="/#faq"
            className={cn(
              "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/" &&
                hash === "#faq" &&
                "text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
            )}
          >
            {t("navFaq")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageToggle />
          {isLoggedIn ? (
            <>
              <div className="hidden sm:flex items-center max-w-[200px] truncate">
                {credits !== null ? (
                  <span className="mr-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {credits} {t("creditsUnit")}
                  </span>
                ) : null}
                <span className="text-sm font-semibold truncate">{displayName}</span>
              </div>
              <form action={onSignOut}>
                <Button type="submit" variant="outline">
                  {t("signOut")}
                </Button>
              </form>
            </>
          ) : (
            <AuthMenu signInLabel={t("signIn")} continueWithGoogleLabel={t("continueWithGoogle")} />
          )}
        </div>
      </div>
    </header>
  )
}
