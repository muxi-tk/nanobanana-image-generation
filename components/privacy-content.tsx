"use client"

import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"
import { useI18n } from "@/components/i18n-provider"

export function PrivacyContent() {
  const { locale } = useI18n()
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"
  const copy =
    locale === "zh"
      ? {
          label: "法律",
          title: "隐私政策",
          updated: "更新日期：2025-01-10",
          collectTitle: "我们收集的信息",
          collectItems: [
            "账户数据，例如邮箱、姓名与认证标识。",
            "使用数据，例如提示词、上传素材与生成结果。",
            "账单数据由支付处理方处理，用于订阅与税务。",
          ],
          useTitle: "信息用途",
          useItems: [
            "提供、保护并改进 Nano Banana 服务。",
            "处理付款、防止欺诈并履行法律义务。",
            "发送产品更新、支持回复与账号通知。",
          ],
          shareTitle: "共享与处理方",
          shareBody:
            "我们与可信的第三方服务提供商共享数据，用于认证、支付与 AI 处理。这些服务方仅为完成服务目的处理数据。",
          retainTitle: "保留与选择",
          retainItems: [
            "我们会在账号有效期内或法律要求的期限内保留数据。",
            "你可以通过联系支持申请访问、更正或删除数据。",
          ],
          contactTitle: "联系",
          contactBody: "如有隐私相关问题，请邮件联系",
        }
      : {
          label: "Legal",
          title: "Privacy Policy",
          updated: "Last updated: 2025-01-10",
          collectTitle: "Information we collect",
          collectItems: [
            "Account data such as email, name, and authentication identifiers.",
            "Usage data like prompts, uploaded assets, and generated outputs.",
            "Billing data handled by our payment processor for subscriptions and taxes.",
          ],
          useTitle: "How we use information",
          useItems: [
            "Provide, secure, and improve the Nano Banana service.",
            "Process payments, prevent fraud, and comply with legal requirements.",
            "Communicate product updates, support responses, and account notices.",
          ],
          shareTitle: "Sharing and processors",
          shareBody:
            "We share data with trusted third-party service providers for authentication, payments, and AI processing. These providers process data only to deliver their services on our behalf.",
          retainTitle: "Retention and choices",
          retainItems: [
            "We retain data as long as your account is active or required for legal obligations.",
            "You can request access, correction, or deletion by contacting support.",
          ],
          contactTitle: "Contact",
          contactBody: "Email us at",
        }

  return (
    <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{copy.label}</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.updated}</p>
      </div>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.collectTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.collectItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.useTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.useItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.shareTitle}</h2>
          <p className="mt-3">{copy.shareBody}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.retainTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.retainItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.contactTitle}</h2>
          <p className="mt-3">
            {copy.contactBody}{" "}
            <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
              {supportEmail}
            </a>{" "}
            {locale === "zh" ? "联系我们。" : "with privacy-related questions."}
          </p>
        </Card>
      </div>
    </section>
  )
}
