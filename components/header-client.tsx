"use client"

import Image from "next/image"
import Link from "next/link"
import { AuthMenu } from "@/components/auth-menu"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useI18n } from "@/components/i18n-provider"

type HeaderClientProps = {
  displayName: string | null
  isLoggedIn: boolean
  onSignOut: () => void
}

export function HeaderClient({ displayName, isLoggedIn, onSignOut }: HeaderClientProps) {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto px-4 max-w-7xl flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/prism.png" alt="Nano Banana logo" width={36} height={36} className="h-9 w-9" />
          <span className="text-foreground">Nano Banana</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/generator" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("navGenerator")}
          </Link>
          <Link href="/#showcase" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("navExamples")}
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("navPricing")}
          </Link>
          <Link href="/support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("navSupport")}
          </Link>
          <Link href="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("navFaq")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageToggle />
          {isLoggedIn ? (
            <>
              <div className="hidden sm:flex items-center max-w-[200px] truncate">
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
