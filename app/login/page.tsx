import { LoginContent } from "@/components/login-content"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string } | Promise<{ next?: string }>
}) {
  const resolved = await Promise.resolve(searchParams)
  const next = resolved?.next

  return (
    <main className="min-h-screen bg-background">
      <LoginContent nextUrl={next} />
    </main>
  )
}
