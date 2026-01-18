"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/components/i18n-provider"
import { siteConfig } from "@/lib/site"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

type PlanSnapshot = {
  userId?: string | null
  plan?: string | null
  cycle?: string | null
  subscriptionStatus?: string | null
  credits?: number | null
  subscriptions?: SubscriptionEntry[]
}

type BillingResponse = {
  portalUrl?: string | null
}

type SubscriptionEntry = {
  id: string
  plan?: string | null
  cycle?: string | null
  creditsRemaining?: number | null
  expiresAt?: string | null
  createdAt?: string | null
  active?: boolean
}

const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase()

export function PlanContent() {
  const { t, locale } = useI18n()
  const [snapshot, setSnapshot] = useState<PlanSnapshot | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const load = async () => {
      try {
        const [statusRes, billingRes] = await Promise.all([
          fetch("/api/auth/status", { cache: "no-store", signal: controller.signal }),
          fetch("/api/creem/billing", { cache: "no-store", signal: controller.signal }),
        ])

        if (statusRes.ok) {
          const data = (await statusRes.json().catch(() => null)) as PlanSnapshot | null
          if (isMounted) {
            setSnapshot(data)
          }
        }

        if (billingRes.ok) {
          const data = (await billingRes.json().catch(() => null)) as BillingResponse | null
          if (isMounted) {
            setPortalUrl(data?.portalUrl ?? null)
          }
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return
        }
        console.error("Failed to load plan snapshot", err)
      }
    }
    load()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [refreshKey])

  useEffect(() => {
    const userId = snapshot?.userId
    if (!userId) {
      return
    }
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`plan-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_grants", filter: `user_id=eq.${userId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "billing_records", filter: `user_id=eq.${userId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [snapshot?.userId])

  const credits = typeof snapshot?.credits === "number" ? snapshot?.credits : 0
  const formatStatus = (value: string | null | undefined) => {
    const normalized = normalize(value)
    if (!normalized) {
      return "-"
    }
    if (normalized === "active") return t("planStatusActive")
    if (normalized === "expired") return t("planStatusExpired")
    if (normalized === "canceled" || normalized === "cancelled") return t("billingStatusCanceled")
    if (normalized === "past_due") return t("billingStatusPastDue")
    if (normalized === "payment_failed") return t("billingStatusPaymentFailed")
    if (normalized === "unpaid") return t("billingStatusUnpaid")
    return normalized.replace(/_/g, " ")
  }
  const resolvePlanLabel = (value: string | null | undefined) => {
    const key = normalize(value)
    if (!key) {
      return t("billingPlanFree")
    }
    if (key === "starter") return t("planStarter")
    if (key === "pro") return t("planPro")
    if (key === "team") return t("planTeam")
    if (key === "enterprise") return t("planEnterprise")
    return key
  }
  const subscriptionCycleLabel = (value: string | null | undefined) => {
    const key = normalize(value)
    if (key === "yearly") return t("planCycleYearly")
    if (key === "monthly") return t("planCycleMonthly")
    return "-"
  }
  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return "-"
    }
    const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    return formatter.format(parsed)
  }
  const planRank = (value: string | null | undefined) => {
    const key = normalize(value)
    if (key === "enterprise" || key === "team") return 3
    if (key === "pro" || key === "studio" || key === "vip") return 2
    if (key === "starter") return 1
    return 0
  }
  const subscriptions = useMemo(() => {
    const list = snapshot?.subscriptions ? [...snapshot.subscriptions] : []
    return list.sort((a, b) => {
      const aActive = Boolean(a.active)
      const bActive = Boolean(b.active)
      if (aActive !== bActive) return aActive ? -1 : 1
      const rankDiff = planRank(b.plan) - planRank(a.plan)
      if (rankDiff !== 0) return rankDiff
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [snapshot?.subscriptions])
  const summaryPlanKey = normalize(subscriptions[0]?.plan ?? snapshot?.plan)
  const summaryCycleKey = normalize(subscriptions[0]?.cycle ?? snapshot?.cycle)
  const planLabel = useMemo(() => resolvePlanLabel(summaryPlanKey), [summaryPlanKey, t])
  const cycleLabel =
    summaryCycleKey === "yearly"
      ? t("planCycleYearly")
      : summaryCycleKey === "monthly"
        ? t("planCycleMonthly")
        : "-"
  const allowSelfManage = Boolean(portalUrl && (summaryPlanKey || subscriptions.length))

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{t("planTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("planSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("billingPlanLabel")}</CardTitle>
          <CardDescription>{t("billingPlanDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">{planLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("billingCreditsLabel")}: {credits}
              </p>
            </div>
            {allowSelfManage ? (
              <Button asChild variant="outline">
                <Link href={portalUrl as string} target="_blank">
                  {t("billingManage")}
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("planStatusLabel")}</p>
              <p className="mt-1 text-sm font-medium">{formatStatus(snapshot?.subscriptionStatus)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("planCycleLabel")}</p>
              <p className="mt-1 text-sm font-medium">{cycleLabel}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">{t("planSubscriptionsTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("planSubscriptionsDesc")}</p>
            </div>
            {subscriptions.length ? (
              <div className="space-y-2">
                {subscriptions.map((item, index) => (
                  <div
                    key={item.id || `${item.plan}-${item.cycle}-${item.createdAt ?? index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{resolvePlanLabel(item.plan)}</p>
                      <p className="text-xs text-muted-foreground">{subscriptionCycleLabel(item.cycle)}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        {t("planSubscriptionCredits")}: {Math.max(0, item.creditsRemaining ?? 0)}
                      </p>
                      <p>
                        {t("planSubscriptionExpires")}: {formatDate(item.expiresAt)}
                      </p>
                      <p>
                        {t("planStatusLabel")}: {item.active ? t("planStatusActive") : t("planStatusExpired")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("planSubscriptionsEmpty")}</p>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("supportEmailLabel")}{" "}
            <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
              {supportEmail}
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
