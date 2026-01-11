"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, CreditCard, Loader2, Package, ShieldCheck, Sparkles } from "lucide-react"
import { useSearchParams } from "next/navigation"

type BillingCycle = "monthly" | "yearly"
type PlanView = "subscriptions" | "credit-packs"

type Plan = {
  id: string
  name: string
  description: string
  badge?: string
  highlight?: boolean
  monthlyPrice: number
  yearlyPrice: number
  yearlyTotal: number
  yearlyOriginal?: number
  yearlyBadge?: string
  monthlyCredits: number
  yearlyCredits: number
  cta: string
  features: string[]
  yearlyExtras?: string[]
}

type CreditPack = {
  id: string
  name: string
  description: string
  badge?: string
  highlight?: boolean
  price: number
  credits: number
  cta: string
  features: string[]
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For individuals and light use",
    monthlyPrice: 15,
    yearlyPrice: 12,
    yearlyTotal: 144,
    yearlyOriginal: 180,
    monthlyCredits: 200,
    yearlyCredits: 2400,
    cta: "Subscribe Now",
    features: [
      "100 high-quality images / month",
      "Standard generation speed",
      "Basic customer support",
      "JPG/PNG downloads",
    ],
    yearlyExtras: ["Commercial Use License"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professional creators and teams",
    badge: "Most popular",
    highlight: true,
    monthlyPrice: 39,
    yearlyPrice: 19.5,
    yearlyTotal: 234,
    yearlyOriginal: 468,
    yearlyBadge: "SAVE 50%",
    monthlyCredits: 800,
    yearlyCredits: 9600,
    cta: "Subscribe Now",
    features: [
      "400 high-quality images / month",
      "Seedream-4 model",
      "Nanobanana-Pro model",
      "Priority generation queue",
      "Priority customer support",
      "JPG/PNG/WebP downloads",
      "Batch generation",
    ],
    yearlyExtras: ["Commercial Use License"],
  },
  {
    id: "team",
    name: "Enterprise",
    description: "For large businesses and pro studios",
    monthlyPrice: 160,
    yearlyPrice: 80,
    yearlyTotal: 960,
    yearlyOriginal: 1920,
    yearlyBadge: "SAVE 50%",
    monthlyCredits: 3600,
    yearlyCredits: 43200,
    cta: "Subscribe Now",
    features: [
      "1,800 high-quality images / month",
      "Seedream-4 model",
      "Nanobanana-Pro model",
      "Fastest generation speed",
      "Dedicated account manager",
      "All format downloads",
      "Batch generation",
    ],
    yearlyExtras: ["Commercial Use License"],
  },
]

const creditPacks: CreditPack[] = [
  {
    id: "starter-pack",
    name: "Starter Pack",
    description: "Try out our AI capabilities",
    price: 30,
    credits: 500,
    cta: "Buy Now",
    features: ["500 credits included", "Never expires", "All features unlocked"],
  },
  {
    id: "growth-pack",
    name: "Growth Pack",
    description: "Perfect for regular creators",
    badge: "Popular",
    highlight: true,
    price: 80,
    credits: 1500,
    cta: "Buy Now",
    features: ["1500 credits included", "Never expires", "Priority support included"],
  },
  {
    id: "professional-pack",
    name: "Professional Pack",
    description: "For serious content creators",
    price: 200,
    credits: 3600,
    cta: "Buy Now",
    features: ["3600 credits included", "Never expires", "Priority support & batch processing"],
  },
  {
    id: "enterprise-pack",
    name: "Enterprise Pack",
    description: "Maximum value for teams",
    price: 800,
    credits: 15000,
    cta: "Buy Now",
    features: ["15000 credits included", "Never expires", "Dedicated support"],
  },
]

export function PricingPlans() {
  const searchParams = useSearchParams()
  const [planView, setPlanView] = useState<PlanView>("subscriptions")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get("status")
  const returnedPlan = searchParams.get("plan")
  const viewParam = searchParams.get("view")
  const cycleParam = searchParams.get("cycle")

  useEffect(() => {
    if (status === "success") {
      setMessage("Thanks! Your checkout finished successfully. You can close this tab or jump back in.")
    }
  }, [status])

  useEffect(() => {
    if (viewParam === "subscriptions" || viewParam === "credit-packs") {
      setPlanView(viewParam)
    }
    if (cycleParam === "monthly" || cycleParam === "yearly") {
      setBillingCycle(cycleParam)
    }
  }, [viewParam, cycleParam])

  useEffect(() => {
    const loginReturn = sessionStorage.getItem("nb_login_return")
    if (!loginReturn) {
      return
    }
    sessionStorage.removeItem("nb_login_return")

    const pendingPlan = sessionStorage.getItem("nb_pending_plan")
    if (pendingPlan) {
      const plan = plans.find((item) => item.id === pendingPlan)
      sessionStorage.removeItem("nb_pending_plan")
      if (plan) {
        setPlanView("subscriptions")
        return
      }
    }

    const pendingPack = sessionStorage.getItem("nb_pending_pack")
    if (!pendingPack) {
      return
    }

    const pack = creditPacks.find((item) => item.id === pendingPack)
    sessionStorage.removeItem("nb_pending_pack")
    if (!pack) {
      return
    }

    setPlanView("credit-packs")
  }, [])

  const priceLabel = (plan: Plan, cycle: BillingCycle) => {
    const amount = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
    return { amount }
  }

  const formatPrice = useMemo(() => (value: number) => value.toFixed(2), [])

  const startCheckout = async (plan: Plan) => {
    setError(null)
    setLoadingPlan(plan.id)
    setMessage(null)

    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    // Require login before purchasing
    const authRes = await fetch("/api/auth/status", { cache: "no-store" })
    if (authRes.status === 401) {
      try {
        sessionStorage.setItem("nb_pending_plan", plan.id)
        sessionStorage.setItem("nb_login_return", "1")
      } catch (err) {
        console.warn("Failed to persist pending checkout data", err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      setLoadingPlan(null)
      return
    }

    if (!authRes.ok) {
      setError("Unable to verify login status. Please try again.")
      setLoadingPlan(null)
      return
    }

    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          cycle: billingCycle,
        }),
      })

      const data = (await res.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null

      if (!res.ok) {
        setError(data?.error || "Unable to start checkout. Please try again.")
        return
      }

      if (!data?.checkoutUrl) {
        setError("Creem did not return a checkout link. Check your configuration and try again.")
        return
      }

      setMessage("Redirecting to secure Creem checkout...")
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const startPackCheckout = async (pack: CreditPack) => {
    setError(null)
    setLoadingPack(pack.id)
    setMessage(null)
    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    const authRes = await fetch("/api/auth/status", { cache: "no-store" })
    if (authRes.status === 401) {
      try {
        sessionStorage.setItem("nb_pending_pack", pack.id)
        sessionStorage.setItem("nb_login_return", "1")
      } catch (err) {
        console.warn("Failed to persist pending pack data", err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      setLoadingPack(null)
      return
    }

    if (!authRes.ok) {
      setError("Unable to verify login status. Please try again.")
      setLoadingPack(null)
      return
    }

    try {
      const res = await fetch("/api/creem/pack-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack: pack.id,
        }),
      })

      const data = (await res.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null

      if (!res.ok) {
        setError(data?.error || "Unable to start checkout. Please try again.")
        return
      }

      if (!data?.checkoutUrl) {
        setError("Creem did not return a checkout link. Check your configuration and try again.")
        return
      }

      setMessage("Redirecting to secure Creem checkout...")
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error. Please try again.")
    } finally {
      setLoadingPack(null)
    }
  }


  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 p-2 text-sm shadow-sm">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition",
                planView === "subscriptions"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setPlanView("subscriptions")}
              aria-pressed={planView === "subscriptions"}
            >
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition",
                planView === "credit-packs"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setPlanView("credit-packs")}
              aria-pressed={planView === "credit-packs"}
            >
              <Package className="h-4 w-4" />
              Credit Packs
            </button>
          </div>
        </div>
        {planView === "subscriptions" ? (
          <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/70 p-2 text-sm shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              className="rounded-full px-5"
              onClick={() => setBillingCycle("monthly")}
              aria-pressed={billingCycle === "monthly"}
            >
              Monthly
            </Button>
            <Button
              type="button"
              size="sm"
              variant={billingCycle === "yearly" ? "default" : "ghost"}
              className="rounded-full px-5"
              onClick={() => setBillingCycle("yearly")}
              aria-pressed={billingCycle === "yearly"}
            >
              Annual
            </Button>
          </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Secure Creem checkout</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Cancel anytime</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1">
            <span>Prices in USD</span>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
          {returnedPlan ? ` (Plan: ${returnedPlan})` : null}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {planView === "subscriptions" ? (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const { amount } = priceLabel(plan, billingCycle)
            const isYearly = billingCycle === "yearly"
            const creditsLabel = isYearly
              ? `${plan.yearlyCredits} credits / year`
              : `${plan.monthlyCredits} credits / month`
            const visibleFeatures = isYearly && plan.yearlyExtras ? [...plan.features, ...plan.yearlyExtras] : plan.features
            return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col border-border/70",
                plan.highlight ? "border-primary/60 shadow-lg shadow-primary/10" : ""
              )}
            >
                {plan.badge ? (
                  <div className="absolute right-4 top-4">
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      {plan.badge}
                    </Badge>
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">${formatPrice(amount)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    {isYearly ? (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {plan.yearlyOriginal ? (
                          <span className="text-muted-foreground line-through">
                            ${formatPrice(plan.yearlyOriginal)}/year
                          </span>
                        ) : null}
                        <span className="font-semibold text-emerald-700">${formatPrice(plan.yearlyTotal)}/year</span>
                        {plan.yearlyBadge ? (
                          <Badge variant="secondary" className="bg-rose-500/15 text-rose-600">
                            {plan.yearlyBadge}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {creditsLabel}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {visibleFeatures.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-2">
                    <Button
                      type="button"
                      className={cn(
                        "w-full",
                        plan.highlight
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      )}
                      disabled={loadingPlan === plan.id}
                      onClick={() => startCheckout(plan)}
                    >
                      {loadingPlan === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {creditPacks.map((pack) => (
            <Card
              key={pack.id}
              className={cn(
                "relative flex h-full flex-col border-border/70",
                pack.highlight ? "border-primary/60 shadow-lg shadow-primary/10" : ""
              )}
            >
              {pack.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {pack.badge}
                  </Badge>
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-1 text-center">
                  <h3 className="text-xl font-semibold">{pack.name}</h3>
                  <p className="text-sm text-muted-foreground">{pack.description}</p>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold tracking-tight text-primary">${formatPrice(pack.price)}</div>
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {pack.credits} credits
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-4 w-4" />
                    One-time purchase - No expiry
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {pack.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  <Button
                    type="button"
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20"
                    disabled={loadingPack === pack.id}
                    onClick={() => startPackCheckout(pack)}
                  >
                    {loadingPack === pack.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {pack.cta}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
