import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SupportContent } from "@/components/support-content"

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SupportContent />

      <Footer />
    </main>
  )
}
