"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthMenu } from "@/components/auth-menu"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { BadgeCheck, Coins, CreditCard, History, LogOut } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

type HeaderClientProps = {
  avatarUrl: string | null
  displayName: string | null
  email: string | null
  isLoggedIn: boolean
  onSignOut: () => void
  userId: string | null
  withSidebar?: boolean
}

type SubscriptionEntry = {
  plan?: string | null
  cycle?: string | null
  creditsRemaining?: number | null
  expiresAt?: string | null
  createdAt?: string | null
  active?: boolean
}

const planRank = (value: string | null | undefined) => {
  const key = (value || "").trim().toLowerCase()
  if (key === "enterprise" || key === "team") return 3
  if (key === "pro" || key === "studio" || key === "vip") return 2
  if (key === "starter") return 1
  return 0
}

const pickBestPlan = (entries?: SubscriptionEntry[] | null) => {
  const list = Array.isArray(entries) ? entries : []
  const active = list.filter((entry) => entry?.active && entry?.plan)
  if (!active.length) return null
  const sorted = [...active].sort((a, b) => {
    const rankDiff = planRank(b.plan) - planRank(a.plan)
    if (rankDiff !== 0) return rankDiff
    const aExpiry = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER
    const bExpiry = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER
    if (aExpiry !== bExpiry) return bExpiry - aExpiry
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bCreated - aCreated
  })
  return typeof sorted[0]?.plan === "string" ? sorted[0].plan : null
}

export function HeaderClient({
  avatarUrl,
  displayName,
  email,
  isLoggedIn,
  onSignOut,
  userId,
  withSidebar = false,
}: HeaderClientProps) {
  const { t, locale } = useI18n()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [hasCreditPack, setHasCreditPack] = useState(false)
  const [hash, setHash] = useState("")
  const menuTriggerId = "user-menu-trigger"
  const menuContentId = "user-menu-content"
  const initials = useMemo(() => {
    const base = (displayName || email || "").trim()
    if (!base) {
      return "U"
    }
    const parts = base.split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const second = parts.length > 1 ? parts[1]?.[0] ?? "" : ""
    const combined = `${first}${second}`.trim()
    return combined ? combined.toUpperCase() : "U"
  }, [displayName, email])
  const nameLabel = displayName || email || "User"
  const showEmail = Boolean(email && displayName && email !== displayName)
  const planKey = useMemo(() => (plan || "").trim().toLowerCase(), [plan])
  const planLabel = useMemo(() => {
    if (!planKey) {
      return locale === "zh" ? "免费版" : t("billingPlanFree")
    }
    if (planKey === "starter") {
      const base = t("planStarter")
      return locale === "zh" ? `${base}版` : base
    }
    if (planKey === "pro") {
      const base = t("planPro")
      return locale === "zh" ? `${base}版` : base
    }
    if (planKey === "team") {
      const base = t("planTeam")
      return locale === "zh" ? `${base}版` : base
    }
    if (planKey === "enterprise") {
      const base = t("planEnterprise")
      return locale === "zh" ? `${base}版` : base
    }
    return planKey
  }, [locale, planKey, t])

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash || "")
    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  const refreshCredits = useCallback(async () => {
    if (!isLoggedIn) {
      setCredits(null)
      setPlan(null)
      setHasCreditPack(false)
      return
    }
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" })
      if (!res.ok) {
        setCredits(null)
        setPlan(null)
        setHasCreditPack(false)
        return
      }
      const data = (await res.json().catch(() => null)) as
        | {
            credits?: number
            plan?: string | null
            hasCreditPack?: boolean
            subscriptions?: SubscriptionEntry[]
          }
        | null
      if (typeof data?.credits === "number") {
        setCredits(data.credits)
      } else {
        setCredits(10)
      }
      const bestPlan = pickBestPlan(data?.subscriptions)
      setPlan(bestPlan ?? (typeof data?.plan === "string" ? data.plan : null))
      setHasCreditPack(Boolean(data?.hasCreditPack))
    } catch {
      setCredits(null)
      setPlan(null)
      setHasCreditPack(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    refreshCredits()
  }, [refreshCredits])

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      return
    }
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_grants", filter: `user_id=eq.${userId}` },
        () => {
          refreshCredits()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoggedIn, refreshCredits, userId])

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
      <div className={cn("mx-auto max-w-7xl", withSidebar ? "pl-16 pr-4" : "px-4")}>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Logo className="h-7 w-7 text-foreground" />
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
                <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold">
                  {planLabel}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild id={menuTriggerId}>
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-full bg-muted/70 text-sm font-semibold text-foreground shadow-sm"
                      aria-label={nameLabel}
                    >
                      <Avatar className="size-7">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={nameLabel} /> : null}
                        <AvatarFallback className="bg-muted text-foreground/80">{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    id={menuContentId}
                    align="end"
                    className="w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
                  >
                  <div className="px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{nameLabel}</p>
                        {showEmail ? <p className="text-xs text-muted-foreground">{email}</p> : null}
                      </div>
                    <Avatar className="size-7">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={nameLabel} /> : null}
                        <AvatarFallback className="bg-muted text-[10px] text-foreground/80">{initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                      {planLabel}
                    </Badge>
                    {hasCreditPack ? (
                      <Badge variant="outline" className="px-2 py-0.5 text-xs">
                        {t("memberCreditPack")}
                      </Badge>
                    ) : null}
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span>{t("creditsUnit")}</span>
                    </div>
                    <span className="text-sm font-semibold">{credits ?? 0}</span>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                    <Link href="/history" className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      {t("historyNav")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                    <Link href="/plan" className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      {t("planNav")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                    <Link href="/billing" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {t("billingNav")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                    <form action={onSignOut} className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2">
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        {t("signOut")}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <AuthMenu signInLabel={t("signIn")} continueWithGoogleLabel={t("continueWithGoogle")} />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
