"use client"

import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"
import { useI18n } from "@/components/i18n-provider"

export function TermsContent() {
  const { locale } = useI18n()
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"
  const copy =
    locale === "zh"
      ? {
          label: "条款",
          title: "服务条款",
          updated: "更新日期：2026-01-10",
          usageTitle: "AI 使用与限制",
          usageItems: [
            "服务依赖第三方 AI 模型与处理服务。",
            "我们不主张对第三方模型或其输出拥有权利。",
            "输出可能存在偏差，你需自行审核最终结果。",
            "如违反政策或法律，我们可能限制使用。",
          ],
          billingTitle: "订阅与账单",
          billingItems: [
            "订阅将自动续费，除非你主动取消。",
            "可能涉及税费，并在结账时显示。",
            "如需账单或取消帮助，请联系支持。",
          ],
          refundTitle: "退款",
          refundItems: [
            "退款申请需在购买后 7 天内提交。",
            "仅当已用额度低于总额度的 30% 时可退款。",
            "通过审核的退款将退回原支付方式。",
            "如涉及滥用、欺诈或违反条款，我们可能拒绝退款。",
            "法定消费者权益不受影响。",
          ],
          terminationTitle: "账户终止",
          terminationBody: "如违反条款、滥用服务或带来安全风险，我们可能暂停或终止账户。",
          contactTitle: "联系",
          contactBody: "如对条款有疑问，请邮件联系",
        }
      : {
          label: "Terms",
          title: "Terms of Service",
          updated: "Last updated: 2026-01-10",
          usageTitle: "AI usage and limitations",
          usageItems: [
            "The service relies on third-party AI models and processing providers.",
            "We do not claim ownership of third-party models or their outputs.",
            "Outputs may be inaccurate or unexpected; you are responsible for final review.",
            "We may restrict usage that violates provider policies or applicable laws.",
          ],
          billingTitle: "Subscriptions and billing",
          billingItems: [
            "Plans renew automatically unless canceled.",
            "Taxes may apply and are shown during checkout.",
            "Contact support for billing questions or cancellation assistance.",
          ],
          refundTitle: "Refunds",
          refundItems: [
            "Refund requests must be submitted within 7 days of purchase.",
            "Refunds are available only if used credits are less than 30% of the total credits purchased.",
            "Approved refunds are processed back to the original payment method.",
            "We may decline refunds for abuse, fraud, or violations of these terms.",
            "Statutory consumer rights remain unaffected where applicable.",
          ],
          terminationTitle: "Account termination",
          terminationBody:
            "We may suspend or terminate accounts that violate these terms, misuse the service, or pose security risks.",
          contactTitle: "Contact",
          contactBody: "Email",
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
          <h2 className="text-lg font-semibold text-foreground">{copy.usageTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.usageItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.billingTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.billingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.refundTitle}</h2>
          <ul className="mt-3 space-y-2">
            {copy.refundItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.terminationTitle}</h2>
          <p className="mt-3">{copy.terminationBody}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.contactTitle}</h2>
          <p className="mt-3">
            {copy.contactBody}{" "}
            <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
              {supportEmail}
            </a>
            .
          </p>
        </Card>
      </div>
    </section>
  )
}
