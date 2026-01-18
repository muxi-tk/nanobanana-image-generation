import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TermsContent } from "@/components/terms-content"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <TermsContent />
      <Footer />
    </main>
  )
}
