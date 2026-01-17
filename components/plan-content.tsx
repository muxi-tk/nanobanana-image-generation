"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/components/i18n-provider"

type PlanSnapshot = {
  plan?: string | null
  cycle?: string | null
  subscriptionStatus?: string | null
  credits?: number | null
}

type BillingResponse = {
  portalUrl?: string | null
}

const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase()

const formatStatus = (value: string | null | undefined) => {
  if (!value) {
    return "-"
  }
  return value.replace(/_/g, " ")
}

export function PlanContent() {
  const { t } = useI18n()
  const [snapshot, setSnapshot] = useState<PlanSnapshot | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)

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
  }, [])

  const planKey = normalize(snapshot?.plan)
  const cycleKey = normalize(snapshot?.cycle)
  const credits = typeof snapshot?.credits === "number" ? snapshot?.credits : 0
  const planLabel = useMemo(() => {
    if (!planKey) {
      return t("billingPlanFree")
    }
    if (planKey === "starter") return t("planStarter")
    if (planKey === "pro") return t("planPro")
    if (planKey === "team") return t("planTeam")
    if (planKey === "enterprise") return t("planEnterprise")
    return planKey
  }, [planKey, t])
  const cycleLabel =
    cycleKey === "yearly" ? t("planCycleYearly") : cycleKey === "monthly" ? t("planCycleMonthly") : "-"
  const allowSelfManage = Boolean(portalUrl && planKey && planKey !== "starter")

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
        </CardContent>
      </Card>
    </main>
  )
}
