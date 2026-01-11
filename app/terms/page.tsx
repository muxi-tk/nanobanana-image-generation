import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"

export default function TermsPage() {
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: 2025-01-10</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Using the service</h2>
            <ul className="mt-3 space-y-2">
              <li>You must be at least 18 years old or have permission from a legal guardian.</li>
              <li>Do not upload content you do not have rights to use.</li>
              <li>Do not use the service for illegal, harmful, or abusive purposes.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">AI usage and limitations</h2>
            <ul className="mt-3 space-y-2">
              <li>The service relies on third-party AI models and processing providers.</li>
              <li>We do not claim ownership of third-party models or their outputs.</li>
              <li>Outputs may be inaccurate or unexpected; you are responsible for final review.</li>
              <li>We may restrict usage that violates provider policies or applicable laws.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Subscriptions and billing</h2>
            <ul className="mt-3 space-y-2">
              <li>Plans are billed through Creem and renew automatically unless canceled.</li>
              <li>Taxes may apply and are shown during checkout.</li>
              <li>Contact support for billing questions or cancellation assistance.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Refunds</h2>
            <ul className="mt-3 space-y-2">
              <li>Refund requests must be submitted within 7 days of purchase.</li>
              <li>Refunds are available only if used credits are less than 30% of the total credits purchased.</li>
              <li>Approved refunds are processed back to the original payment method.</li>
              <li>We may decline refunds for abuse, fraud, or violations of these terms.</li>
              <li>Statutory consumer rights remain unaffected where applicable.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Account termination</h2>
            <p className="mt-3">
              We may suspend or terminate accounts that violate these terms, misuse the service, or pose security risks.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              Email{" "}
              <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
                {supportEmail}
              </a>{" "}
              for questions about these terms.
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
