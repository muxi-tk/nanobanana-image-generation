import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Decorative banana elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-10 rotate-12">🍌</div>
      <div className="absolute bottom-20 right-20 text-8xl opacity-10 -rotate-12">🍌</div>

      <div className="container mx-auto px-4 relative max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Consistent edits with text prompts</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
            Transform Images with
            <span className="text-primary"> Simple Text</span>
          </h1>

          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
            Use a guided AI workflow for character consistency, scene edits, and fast iterations with natural language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/generator">
                Start Editing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#showcase">View Examples</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              One-shot editing
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Multi-image support
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Natural language
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
