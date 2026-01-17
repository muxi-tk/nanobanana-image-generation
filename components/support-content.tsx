"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"
import { useI18n } from "@/components/i18n-provider"

export function SupportContent() {
  const { locale } = useI18n()
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"
  const copy =
    locale === "zh"
      ? {
          label: "支持",
          title: "我们随时为你提供帮助",
          subtitle: "关于账户、账单或产品问题，欢迎联系我们。我们会在 1-2 个工作日内回复。",
          contactTitle: "联系支持",
          contactBody: "邮件联系我们：",
          hoursLabel: "支持时间：",
          billingTitle: "账单与套餐",
          billingBody: "订阅将安全处理。你可以在账户中管理账单，或联系支持获取帮助。",
          billingLink: "查看价格",
          companyTitle: "公司信息",
          companyOperator: "运营主体：",
          companyAddress: "地址：",
          companyRegistration: "注册信息：",
          companyFallback: "运营主体：独立开发者（中国深圳）。相关信息可通过支持邮箱索取。",
          legalPrefix: "查看我们的",
          privacy: "隐私政策",
          terms: "服务条款",
        }
      : {
          label: "Support",
          title: "We are here to help",
          subtitle:
            "Reach us for account, billing, or product questions. We aim to respond within 1-2 business days.",
          contactTitle: "Contact support",
          contactBody: "Email us at",
          hoursLabel: "Support hours:",
          billingTitle: "Billing and plans",
          billingBody: "Subscriptions are processed securely. You can manage billing from your account or contact support.",
          billingLink: "View pricing",
          companyTitle: "Company information",
          companyOperator: "Operator:",
          companyAddress: "Address:",
          companyRegistration: "Registration:",
          companyFallback:
            "Operated by an independent developer in Shenzhen, China. Business details are available upon request via support email.",
          legalPrefix: "Review our",
          privacy: "Privacy Policy",
          terms: "Terms of Service",
        }

  return (
    <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{copy.label}</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="text-lg text-muted-foreground">{copy.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">{copy.contactTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.contactBody}{" "}
            <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
              {supportEmail}
            </a>
            .
          </p>
          {siteConfig.supportHours ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.hoursLabel} {siteConfig.supportHours}
            </p>
          ) : null}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">{copy.billingTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.billingBody}</p>
          <Link href="/pricing" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
            {copy.billingLink}
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold">{copy.companyTitle}</h2>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          {siteConfig.companyName ? <p>{copy.companyOperator} {siteConfig.companyName}</p> : null}
          {siteConfig.companyAddress ? <p>{copy.companyAddress} {siteConfig.companyAddress}</p> : null}
          {siteConfig.companyRegistration ? <p>{copy.companyRegistration} {siteConfig.companyRegistration}</p> : null}
          {!siteConfig.companyName && !siteConfig.companyAddress && !siteConfig.companyRegistration ? (
            <p>{copy.companyFallback}</p>
          ) : null}
        </div>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          {copy.legalPrefix}{" "}
          <Link href="/privacy" className="text-foreground hover:underline">
            {copy.privacy}
          </Link>{" "}
          {locale === "zh" ? "和" : "and"}{" "}
          <Link href="/terms" className="text-foreground hover:underline">
            {copy.terms}
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
