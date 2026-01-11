import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function RefundApplicationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Billing</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Refund Application</h1>
          <p className="text-sm text-muted-foreground">
            Submit your request using the instructions on the Refund Policy page.
          </p>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <Link href="/refund#application" className="text-foreground hover:underline">
            Go to refund application instructions
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
