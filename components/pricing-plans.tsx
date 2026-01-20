"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, CreditCard, Loader2, Package } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/components/i18n-provider"

type BillingView = "monthly" | "yearly" | "credit-packs"

type LocalizedText = {
  en: string
  zh: string
}

type Plan = {
  id: string
  name: LocalizedText
  description: LocalizedText
  badge?: LocalizedText
  highlight?: boolean
  monthlyPrice: number
  yearlyPrice: number
  yearlyBadge?: LocalizedText
  monthlyCredits: number
  yearlyCredits: number
  cta: LocalizedText
  features: { en: string[]; zh: string[] }
  yearlyExtras?: { en: string[]; zh: string[] }
}

type CreditPack = {
  id: string
  name: LocalizedText
  description: LocalizedText
  badge?: LocalizedText
  highlight?: boolean
  price: number
  credits: number
  cta: LocalizedText
  features: { en: string[]; zh: string[] }
}

const plans: Plan[] = [
  {
    id: "starter",
    name: { en: "Starter", zh: "入门" },
    description: { en: "For individuals and light use", zh: "适合个人与轻度使用" },
    monthlyPrice: 15,
    yearlyPrice: 12,
    monthlyCredits: 200,
    yearlyCredits: 2400,
    yearlyBadge: { en: "SAVE 20%", zh: "节省 20%" },
    cta: { en: "Subscribe Now", zh: "立即订阅" },
    features: {
      en: [
        "100 high-quality images / month",
        "Seedream-4.5 model",
        "4K resolution support",
        "Standard generation speed",
        "Email support",
        "JPG/PNG/WebP downloads",
      ],
      zh: ["每月 100 张高质量图片", "Seedream-4.5 模型", "支持 4K 分辨率", "标准生成速度", "邮件支持", "JPG/PNG/WebP 下载"],
    },
    yearlyExtras: { en: ["Commercial Use License"], zh: ["商业使用许可"] },
  },
  {
    id: "pro",
    name: { en: "Pro", zh: "专业" },
    description: { en: "For professional creators and teams", zh: "适合专业创作者与团队" },
    badge: { en: "Most popular", zh: "最受欢迎" },
    highlight: false,
    monthlyPrice: 39,
    yearlyPrice: 19.5,
    yearlyBadge: { en: "SAVE 50%", zh: "节省 50%" },
    monthlyCredits: 800,
    yearlyCredits: 9600,
    cta: { en: "Subscribe Now", zh: "立即订阅" },
    features: {
      en: [
        "400 high-quality images / month",
        "Seedream-4.5 model",
        "4K resolution support",
        "Priority generation queue",
        "Priority email support",
        "JPG/PNG/WebP downloads",
        "Batch generation",
      ],
      zh: [
        "每月 400 张高质量图片",
        "Seedream-4.5 模型",
        "支持 4K 分辨率",
        "优先生成队列",
        "优先邮件支持",
        "JPG/PNG/WebP 下载",
        "批量生成",
      ],
    },
    yearlyExtras: { en: ["Commercial Use License"], zh: ["商业使用许可"] },
  },
  {
    id: "enterprise",
    name: { en: "Enterprise", zh: "企业" },
    description: { en: "For large businesses and pro studios", zh: "适合大型团队与工作室" },
    monthlyPrice: 160,
    yearlyPrice: 80,
    yearlyBadge: { en: "SAVE 50%", zh: "节省 50%" },
    monthlyCredits: 3600,
    yearlyCredits: 43200,
    cta: { en: "Subscribe Now", zh: "立即订阅" },
    features: {
      en: [
        "1,800 high-quality images / month",
        "Seedream-4.5 model",
        "4K resolution support",
        "Fastest generation speed",
        "Dedicated account manager",
        "JPG/PNG/WebP downloads",
        "Batch generation",
      ],
      zh: [
        "每月 1,800 张高质量图片",
        "Seedream-4.5 模型",
        "支持 4K 分辨率",
        "最快生成速度",
        "专属客户经理",
        "JPG/PNG/WebP 下载",
        "批量生成",
      ],
    },
    yearlyExtras: { en: ["Commercial Use License"], zh: ["商业使用许可"] },
  },
]

const creditPacks: CreditPack[] = [
  {
    id: "starter-pack",
    name: { en: "Starter Pack", zh: "入门包" },
    description: { en: "Try out our AI capabilities", zh: "体验我们的 AI 能力" },
    price: 30,
    credits: 500,
    cta: { en: "Buy Now", zh: "立即购买" },
    features: {
      en: ["500 credits included", "Never expires", "All features unlocked"],
      zh: ["含 500 积分", "永久有效", "解锁全部功能"],
    },
  },
  {
    id: "growth-pack",
    name: { en: "Growth Pack", zh: "成长包" },
    description: { en: "Perfect for regular creators", zh: "适合高频创作者" },
    badge: { en: "Most popular", zh: "最受欢迎" },
    highlight: true,
    price: 80,
    credits: 1500,
    cta: { en: "Buy Now", zh: "立即购买" },
    features: {
      en: ["1500 credits included", "Never expires", "Priority email support included"],
      zh: ["含 1500 积分", "永久有效", "包含优先邮件支持"],
    },
  },
  {
    id: "professional-pack",
    name: { en: "Professional Pack", zh: "专业包" },
    description: { en: "For serious content creators", zh: "适合专业内容创作者" },
    price: 200,
    credits: 3600,
    cta: { en: "Buy Now", zh: "立即购买" },
    features: {
      en: ["3600 credits included", "Never expires", "Priority email support & batch processing"],
      zh: ["含 3600 积分", "永久有效", "优先邮件支持与批量处理"],
    },
  },
  {
    id: "enterprise-pack",
    name: { en: "Enterprise Pack", zh: "企业包" },
    description: { en: "Maximum value for teams", zh: "团队最大价值" },
    price: 800,
    credits: 15000,
    cta: { en: "Buy Now", zh: "立即购买" },
    features: {
      en: ["15000 credits included", "Never expires", "Dedicated email support"],
      zh: ["含 15000 积分", "永久有效", "专属邮件支持"],
    },
  },
]

export function PricingPlans() {
  const searchParams = useSearchParams()
  const { locale } = useI18n()
  const localeKey = locale === "zh" ? "zh" : "en"
  const copy =
    locale === "zh"
      ? {
          creditPacks: "积分包",
          monthly: "月付",
          annual: "年付",
          perMonth: "/月",
          perMonthYearly: "/月（按年计费）",
          billedAnnually: (total: string) => `年付 ${total}`,
          creditsPerMonth: (credits: number) => `每月 ${credits} 积分`,
          creditsPerYear: (credits: number) => `每年 ${credits} 积分`,
          packCredits: (credits: number) => `${credits} 积分`,
          loginError: "无法验证登录状态，请重试。",
          startCheckoutError: "无法开始结账，请重试。",
          checkoutLinkError: "未返回结账链接，请检查配置后重试。",
          unknownError: "未知错误，请重试。",
          authPersistError: "无法保存待处理订单数据",
          oneTime: "一次性购买 - 永久有效",
        }
      : {
          creditPacks: "Credit Packs",
          monthly: "Monthly",
          annual: "Annual",
          perMonth: "/month",
          perMonthYearly: "/month (billed annually)",
          billedAnnually: (total: string) => `Billed ${total}/year`,
          creditsPerMonth: (credits: number) => `${credits} credits / month`,
          creditsPerYear: (credits: number) => `${credits} credits / year`,
          packCredits: (credits: number) => `${credits} credits`,
          loginError: "Unable to verify login status. Please try again.",
          startCheckoutError: "Unable to start checkout. Please try again.",
          checkoutLinkError: "Checkout did not return a link. Check your configuration and try again.",
          unknownError: "Unknown error. Please try again.",
          authPersistError: "Failed to persist pending checkout data",
          oneTime: "One-time purchase - No expiry",
        }
  const [billingView, setBillingView] = useState<BillingView>("yearly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const viewParam = searchParams.get("view")
  const cycleParam = searchParams.get("cycle")

  useEffect(() => {
    if (viewParam === "credit-packs") {
      setBillingView("credit-packs")
      return
    }
    if (cycleParam === "monthly" || cycleParam === "yearly") {
      setBillingView(cycleParam)
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
      const pendingKey = pendingPlan === "team" ? "enterprise" : pendingPlan
      const plan = plans.find((item) => item.id === pendingKey)
      sessionStorage.removeItem("nb_pending_plan")
      if (plan) {
        setBillingView("yearly")
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

    setBillingView("credit-packs")
  }, [])

  const priceLabel = (plan: Plan, cycle: BillingView) => {
    const amount = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
    return { amount }
  }

  const formatPrice = useMemo(() => (value: number) => value.toFixed(2), [])

  const startCheckout = async (plan: Plan) => {
    setError(null)
    setLoadingPlan(plan.id)

    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    // Require login before purchasing
    const authRes = await fetch("/api/auth/status", { cache: "no-store" })
    if (authRes.status === 401) {
      try {
        sessionStorage.setItem("nb_pending_plan", plan.id)
        sessionStorage.setItem("nb_login_return", "1")
      } catch (err) {
        console.warn(copy.authPersistError, err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      setLoadingPlan(null)
      return
    }

    if (!authRes.ok) {
      setError(copy.loginError)
      setLoadingPlan(null)
      return
    }

    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          cycle: billingView === "monthly" ? "monthly" : "yearly",
        }),
      })

      const data = (await res.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null

      if (!res.ok) {
        setError(data?.error || copy.startCheckoutError)
        return
      }

      if (!data?.checkoutUrl) {
        setError(copy.checkoutLinkError)
        return
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unknownError)
    } finally {
      setLoadingPlan(null)
    }
  }

  const startPackCheckout = async (pack: CreditPack) => {
    setError(null)
    setLoadingPack(pack.id)
    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    const authRes = await fetch("/api/auth/status", { cache: "no-store" })
    if (authRes.status === 401) {
      try {
        sessionStorage.setItem("nb_pending_pack", pack.id)
        sessionStorage.setItem("nb_login_return", "1")
      } catch (err) {
        console.warn(copy.authPersistError, err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      setLoadingPack(null)
      return
    }

    if (!authRes.ok) {
      setError(copy.loginError)
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
        setError(data?.error || copy.startCheckoutError)
        return
      }

      if (!data?.checkoutUrl) {
        setError(copy.checkoutLinkError)
        return
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unknownError)
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
                billingView === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setBillingView("monthly")}
              aria-pressed={billingView === "monthly"}
            >
              <CreditCard className="h-4 w-4" />
              {copy.monthly}
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition",
                billingView === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setBillingView("yearly")}
              aria-pressed={billingView === "yearly"}
            >
              <CreditCard className="h-4 w-4" />
              {copy.annual}
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition",
                billingView === "credit-packs"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setBillingView("credit-packs")}
              aria-pressed={billingView === "credit-packs"}
            >
              <Package className="h-4 w-4" />
              {copy.creditPacks}
            </button>
          </div>
        </div>
        
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {billingView !== "credit-packs" ? (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const { amount } = priceLabel(plan, billingView)
            const isYearly = billingView === "yearly"
            const creditsLabel = isYearly
              ? copy.creditsPerYear(plan.yearlyCredits)
              : copy.creditsPerMonth(plan.monthlyCredits)
            const baseFeatures = plan.features[localeKey]
            const extraFeatures = plan.yearlyExtras ? plan.yearlyExtras[localeKey] : []
            const visibleFeatures = isYearly ? [...baseFeatures, ...extraFeatures] : baseFeatures
            return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col border-border/70",
                plan.badge ? "border-primary/60 ring-1 ring-primary/20" : ""
              )}
            >
                {plan.badge ? (
                  <div className="absolute right-4 top-4">
                    <Badge variant="secondary" className="border border-primary/40 bg-primary/10 text-primary">
                      {plan.badge[localeKey]}
                    </Badge>
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{plan.name[localeKey]}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description[localeKey]}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">${formatPrice(amount)}</span>
                      <span className="text-sm text-muted-foreground">
                        {isYearly ? copy.perMonthYearly : copy.perMonth}
                      </span>
                    </div>
                    {isYearly ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.billedAnnually(`$${formatPrice(amount * 12)}`)}
                      </p>
                    ) : null}
                    {isYearly && plan.yearlyBadge ? (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary" className="bg-primary/15 text-primary">
                          {plan.yearlyBadge[localeKey]}
                        </Badge>
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
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      disabled={loadingPlan === plan.id}
                      onClick={() => startCheckout(plan)}
                    >
                      {loadingPlan === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {plan.cta[localeKey]}
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
                    {pack.badge[localeKey]}
                  </Badge>
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-1 text-center">
                  <h3 className="text-xl font-semibold">{pack.name[localeKey]}</h3>
                  <p className="text-sm text-muted-foreground">{pack.description[localeKey]}</p>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold tracking-tight text-primary">${formatPrice(pack.price)}</div>
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {copy.packCredits(pack.credits)}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-4 w-4" />
                    {copy.oneTime}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {pack.features[localeKey].map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  <Button
                    type="button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loadingPack === pack.id}
                    onClick={() => startPackCheckout(pack)}
                  >
                    {loadingPack === pack.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {pack.cta[localeKey]}
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
