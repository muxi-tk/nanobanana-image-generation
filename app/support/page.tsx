import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"

export default function SupportPage() {
  const supportEmail = siteConfig.supportEmail || "support@yourdomain.com"

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Support</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">We are here to help</h1>
          <p className="text-lg text-muted-foreground">
            Reach us for account, billing, or product questions. We aim to respond within 1-2 business days.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Contact support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
                {supportEmail}
              </a>
              .
            </p>
            {siteConfig.supportHours ? (
              <p className="mt-2 text-sm text-muted-foreground">Support hours: {siteConfig.supportHours}</p>
            ) : null}
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Billing and plans</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscriptions are processed through Creem. You can manage billing from the Creem portal or contact support
              for assistance.
            </p>
            <Link href="/pricing" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
              View pricing
            </Link>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Company information</h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            {siteConfig.companyName ? <p>Operator: {siteConfig.companyName}</p> : null}
            {siteConfig.companyAddress ? <p>Address: {siteConfig.companyAddress}</p> : null}
            {siteConfig.companyRegistration ? <p>Registration: {siteConfig.companyRegistration}</p> : null}
            {!siteConfig.companyName && !siteConfig.companyAddress && !siteConfig.companyRegistration ? (
              <p>Operated by an individual developer. Details are available upon request.</p>
            ) : null}
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Refund policy</h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <p>
              You may request a refund within 7 days of purchase if used credits are less than 30% of the total credits
              included in your plan.
            </p>
            <p>Refunds are not available once usage exceeds this threshold.</p>
            <p>Contact support with your account email and order details to request a review.</p>
          </div>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            Review our{" "}
            <Link href="/privacy" className="text-foreground hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-foreground hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
