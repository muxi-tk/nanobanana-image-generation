import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"

export default function RefundPage() {
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Billing</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Refund Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: 2026-01-10</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
            <ul className="mt-3 space-y-2">
              <li>Refund requests must be submitted within 7 days of purchase.</li>
              <li>Used credits must be less than 30% of the total credits included in the plan.</li>
              <li>Refunds are not available after the eligibility window or usage threshold.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">How refunds are handled</h2>
            <ul className="mt-3 space-y-2">
              <li>Approved refunds are returned to the original payment method.</li>
              <li>Processing times depend on your payment provider and region.</li>
              <li>We may decline requests involving fraud, abuse, or violations of the Terms of Service.</li>
            </ul>
          </Card>

          <Card id="application" className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Refund application</h2>
            <p className="mt-3">
              Email{" "}
              <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
                {supportEmail}
              </a>{" "}
              with your account email, order ID, purchase date, and reason for the request. We will review and respond
              within 1-2 business days.
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
