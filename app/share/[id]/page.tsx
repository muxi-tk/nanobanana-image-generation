import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Logo } from "@/components/logo"
import { createAdminClient } from "@/lib/supabase/admin"

type ShareRecord = {
  image_url: string
}

type SharePageProps = {
  params: Promise<{ id: string }>
}

async function fetchShare(id: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("share_links")
    .select("image_url")
    .eq("id", id)
    .maybeSingle()

  if (error || !data?.image_url) {
    return null
  }

  return data as ShareRecord
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params
  const record = await fetchShare(id)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nanobananaimg.online"
  const shareUrl = `${baseUrl.replace(/\/$/, "")}/share/${id}`

  if (!record) {
    return {
      title: "Shared image | Nano Banana",
      description: "View a shared image on Nano Banana.",
    }
  }

  const title = "Shared image | Nano Banana"
  const description = "Generated with Nano Banana."
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      images: [{ url: record.image_url }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [record.image_url],
    },
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params
  const record = await fetchShare(id)
  const outlineButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
  const outlineButtonSmallClass = `${outlineButtonClass} h-8 gap-1.5 px-3`

  if (!record) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Logo className="h-6 w-6 text-foreground" />
            <span>Nano Banana</span>
          </a>
          <a href="/generator" className={outlineButtonSmallClass}>
            Try the generator
          </a>
        </div>
      </header>
      <section className="container mx-auto max-w-5xl px-4 pb-20 pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shared</p>
          <h1 className="mt-2 text-3xl font-semibold">Generated with Nano Banana</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Explore the image and try the generator if you want to create your own.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
          <img src={record.image_url} alt="Shared image" className="h-full w-full object-contain" />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={record.image_url} download="nano-banana.png" className={outlineButtonClass}>
            Download image
          </a>
        </div>
      </section>
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 nanobananaimg.online. All rights reserved.</p>
          <p>
            Independent product providing a custom interface to third-party AI models. Not affiliated with model
            providers.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            <a href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
