"use client"

import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"
import { useI18n } from "@/components/i18n-provider"

export function RefundContent() {
  const { locale } = useI18n()
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"
  const copy =
    locale === "zh"
      ? {
          label: "账单",
          title: "退款政策",
          updated: "更新日期：2026-01-10",
          eligibility: "退款资格",
          eligibilityItems: [
            "退款申请需在购买后 7 天内提交。",
            "已用额度需少于套餐总额度的 30%。",
            "超过有效期或使用阈值后不支持退款。",
          ],
          handling: "退款处理方式",
          handlingItems: [
            "通过审核的退款将退回至原支付方式。",
            "处理时间取决于支付渠道与地区。",
            "如涉及欺诈、滥用或违反条款，申请可能被拒绝。",
          ],
          application: "退款申请",
          applicationBody:
            "请通过邮件联系我们，提供账号邮箱、订单号、购买日期与退款原因。我们会在 1-2 个工作日内回复。",
        }
      : {
          label: "Billing",
          title: "Refund Policy",
          updated: "Last updated: 2026-01-10",
          eligibility: "Eligibility",
          eligibilityItems: [
            "Refund requests must be submitted within 7 days of purchase.",
            "Used credits must be less than 30% of the total credits included in the plan.",
            "Refunds are not available after the eligibility window or usage threshold.",
          ],
          handling: "How refunds are handled",
          handlingItems: [
            "Approved refunds are returned to the original payment method.",
            "Processing times depend on your payment provider and region.",
            "We may decline requests involving fraud, abuse, or violations of the Terms of Service.",
          ],
          application: "Refund application",
          applicationBody:
            "Email us with your account email, order ID, purchase date, and reason for the request. We will review and respond within 1-2 business days.",
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
          <h2 className="text-lg font-semibold text-foreground">{copy.eligibility}</h2>
          <ul className="mt-3 space-y-2">
            {copy.eligibilityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.handling}</h2>
          <ul className="mt-3 space-y-2">
            {copy.handlingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card id="application" className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.application}</h2>
          <p className="mt-3">
            {locale === "zh" ? "邮件：" : "Email"}{" "}
            <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
              {supportEmail}
            </a>{" "}
            {copy.applicationBody}
          </p>
        </Card>
      </div>
    </section>
  )
}
