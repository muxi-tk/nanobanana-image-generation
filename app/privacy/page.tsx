import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { siteConfig } from "@/lib/site"

export default function PrivacyPage() {
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: 2025-01-10</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <ul className="mt-3 space-y-2">
              <li>Account data such as email, name, and authentication identifiers.</li>
              <li>Usage data like prompts, uploaded assets, and generated outputs.</li>
              <li>Billing data handled by our payment processor for subscriptions and taxes.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">How we use information</h2>
            <ul className="mt-3 space-y-2">
              <li>Provide, secure, and improve the Nano Banana service.</li>
              <li>Process payments, prevent fraud, and comply with legal requirements.</li>
              <li>Communicate product updates, support responses, and account notices.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Sharing and processors</h2>
            <p className="mt-3">
              We share data with trusted third-party service providers for authentication, payments, and AI processing.
              These providers process data only to deliver their services on our behalf.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Retention and choices</h2>
            <ul className="mt-3 space-y-2">
              <li>We retain data as long as your account is active or required for legal obligations.</li>
              <li>You can request access, correction, or deletion by contacting support.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              Email us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-foreground hover:underline">
                {supportEmail}
              </a>{" "}
              with privacy-related questions.
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
