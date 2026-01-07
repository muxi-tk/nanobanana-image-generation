import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const MODEL = "google/gemini-2.5-flash-image"
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const OPENROUTER_TIMEOUT_MS = 120_000

function toDataUrl(mimeType: string, bytes: Uint8Array) {
  const base64 = Buffer.from(bytes).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

function byteLengthFromDataUrl(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",")
  if (commaIndex === -1) return null

  const header = dataUrl.slice(0, commaIndex)
  const base64 = dataUrl.slice(commaIndex + 1)
  if (!/;base64$/i.test(header)) return null

  const normalized = base64.replace(/\s/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error("Auth check failed", authError)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!authData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY on the server." },
      { status: 500 }
    )
  }

  const contentType = request.headers.get("content-type") || ""
  let prompt = ""
  let imageDataUrl: string | null = null

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | { prompt?: unknown; imageDataUrl?: unknown }
      | null

    prompt = String(body?.prompt ?? "").trim()
    const maybeDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl.trim() : ""
    imageDataUrl = maybeDataUrl ? maybeDataUrl : null
  } else {
    // Back-compat: older clients may still submit multipart/form-data.
    const formData = await request.formData()
    prompt = String(formData.get("prompt") ?? "").trim()
    const image = formData.get("image")

    if (image instanceof File && image.size > 0) {
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image too large. Max 10MB." },
          { status: 413 }
        )
      }

      const mimeType = image.type || "image/png"
      const arrayBuffer = await image.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      imageDataUrl = toDataUrl(mimeType, bytes)
    }
  }

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
  }

  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: prompt }]

  if (imageDataUrl) {
    const imageBytes = byteLengthFromDataUrl(imageDataUrl)
    if (typeof imageBytes === "number" && imageBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Max 10MB." },
        { status: 413 }
      )
    }

    contentParts.push({
      type: "image_url",
      image_url: { url: imageDataUrl },
    })
  }

  const openRouterHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  const siteUrl = process.env.OPENROUTER_SITE_URL
  const siteName = process.env.OPENROUTER_SITE_NAME
  if (siteUrl) openRouterHeaders["HTTP-Referer"] = siteUrl
  if (siteName) openRouterHeaders["X-Title"] = siteName

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders,
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      result?.error?.message ||
      result?.error ||
      `OpenRouter request failed (${response.status}).`
    return NextResponse.json({ error: message, details: result }, { status: response.status })
  }

  const message = result?.choices?.[0]?.message
  const imageUrl = message?.images?.[0]?.image_url?.url ?? null
  const text = typeof message?.content === "string" ? message.content : null

  if (!imageUrl) {
    return NextResponse.json(
      {
        error: "No image returned by the model.",
        details: { text },
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ imageUrl, text })
}
