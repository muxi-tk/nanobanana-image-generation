import Link from "next/link"
import { LoginOptions } from "@/app/login/login-options"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string } | Promise<{ next?: string }>
}) {
  const resolved = await Promise.resolve(searchParams)
  const next = resolved?.next

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold">
          <span className="text-4xl">🍌</span>
          <span>Nano Banana</span>
        </Link>

        <div className="w-full rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Create your free account</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to start generating images.
          </p>

          <div className="mt-8">
            <LoginOptions nextUrl={next} />
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="underline underline-offset-4">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
