"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) return siteUrl

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`

  return "http://localhost:3000"
}

export async function signInWithGoogle(formData?: FormData) {
  const supabase = await createClient()
  const baseUrl = getSiteUrl()

  const nextUrl = typeof formData?.get === "function" ? String(formData.get("next") ?? "/") : "/"
  const redirectTo = new URL(`${baseUrl}/auth/callback`)
  if (nextUrl) redirectTo.searchParams.set("next", nextUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
    },
  })

  if (error) {
    console.error("Failed to start Google sign-in", error)
    throw new Error("无法启动 Google 登录，请稍后重试。")
  }

  if (!data?.url) {
    throw new Error("Supabase 未返回登录跳转地址。")
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Failed to sign out", error)
    throw new Error("退出登录失败，请稍后再试。")
  }

  revalidatePath("/", "layout")
}
