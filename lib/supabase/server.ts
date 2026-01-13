import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

async function getCookieStore() {
  const cookieStore = await cookies()

  return {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cookies can only be modified")) {
          return
        }
        console.error("Failed to set auth cookie", error)
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cookies can only be modified")) {
          return
        }
        console.error("Failed to clear auth cookie", error)
      }
    },
  }
}

export async function createClient() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const cookieStore = await getCookieStore()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: cookieStore.get,
      set: cookieStore.set,
      remove: cookieStore.remove,
    },
  })
}
