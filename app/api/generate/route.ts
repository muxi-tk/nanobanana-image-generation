import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const MODEL_MAP: Record<string, string> = {
  "nano-banana": "google/gemini-2.5-flash-image",
  "nano-banana-pro": "google/gemini-3-pro-image-preview",
  "seedream-4-5": "bytedance-seed/seedream-4.5",
}
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
  let imageDataUrls: string[] = []
  let selectedModel = "nano-banana"
  let aspectRatio = "auto"
  let imageCount = 1
  let resolution = "1k"
  let outputFormat = "png"
  let generationMode = "image-edit"

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | {
          prompt?: unknown
          imageDataUrl?: unknown
          imageDataUrls?: unknown
          model?: unknown
          aspectRatio?: unknown
          imageCount?: unknown
          resolution?: unknown
          outputFormat?: unknown
          generationMode?: unknown
        }
      | null

    prompt = String(body?.prompt ?? "").trim()
    const maybeDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl.trim() : ""
    imageDataUrl = maybeDataUrl ? maybeDataUrl : null
    if (Array.isArray(body?.imageDataUrls)) {
      imageDataUrls = body.imageDataUrls.filter((value): value is string => typeof value === "string" && value.trim())
    }
    if (typeof body?.model === "string") {
      selectedModel = body.model
    }
    if (typeof body?.aspectRatio === "string") {
      aspectRatio = body.aspectRatio
    }
    if (typeof body?.resolution === "string") {
      resolution = body.resolution
    }
    if (typeof body?.outputFormat === "string") {
      outputFormat = body.outputFormat
    }
    if (typeof body?.generationMode === "string") {
      generationMode = body.generationMode
    }
    if (typeof body?.imageCount === "string") {
      const parsed = Number.parseInt(body.imageCount, 10)
      if (!Number.isNaN(parsed)) {
        imageCount = parsed
      }
    } else if (typeof body?.imageCount === "number" && Number.isFinite(body.imageCount)) {
      imageCount = Math.max(1, Math.floor(body.imageCount))
    }
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

  if (outputFormat === "webp" && selectedModel !== "seedream-4-5") {
    return NextResponse.json(
      { error: "WebP output is only supported for Seedream 4.5." },
      { status: 400 }
    )
  }
  if (selectedModel === "seedream-4-5" && resolution !== "2k" && resolution !== "4k") {
    return NextResponse.json(
      { error: "Seedream 4.5 only supports 2K and 4K resolutions." },
      { status: 400 }
    )
  }

  if (generationMode === "text-to-image") {
    imageDataUrl = null
    imageDataUrls = []
  }

  const settings: string[] = []
  if (aspectRatio && aspectRatio !== "auto") {
    settings.push(`Aspect ratio: ${aspectRatio}`)
  }
  if (resolution && resolution !== "1k") {
    settings.push(`Resolution: ${resolution.toUpperCase()}`)
  }
  if (outputFormat && outputFormat !== "png") {
    settings.push(`Output format: ${outputFormat.toUpperCase()}`)
  }
  if (imageCount > 1) {
    settings.push(`Number of images: ${imageCount}`)
  }

  const finalPrompt = settings.length ? `${prompt}\n\n${settings.join(". ")}` : prompt

  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: finalPrompt }]

  const candidateImages = imageDataUrls.length ? imageDataUrls : imageDataUrl ? [imageDataUrl] : []
  for (const candidate of candidateImages) {
    const imageBytes = byteLengthFromDataUrl(candidate)
    if (typeof imageBytes === "number" && imageBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large. Max 10MB." }, { status: 413 })
    }
  }

  candidateImages.forEach((candidate) => {
    contentParts.push({
      type: "image_url",
      image_url: { url: candidate },
    })
  })

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
  const providerConfig =
    selectedModel === "nano-banana-pro" || selectedModel === "seedream-4-5"
      ? {
          image_config: {
            aspect_ratio: aspectRatio !== "auto" ? aspectRatio : undefined,
            image_size: resolution.toUpperCase(),
            output_mime_type:
              outputFormat === "jpeg"
                ? "image/jpeg"
                : outputFormat === "webp"
                  ? "image/webp"
                  : "image/png",
          },
        }
      : undefined

  const messageContent = candidateImages.length ? contentParts : finalPrompt
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders,
    body: JSON.stringify({
      model: MODEL_MAP[selectedModel] ?? MODEL_MAP["nano-banana"],
      modalities: ["image", "text"],
      n: imageCount > 1 ? imageCount : undefined,
      provider: providerConfig,
      messages: [
        {
          role: "user",
          content: messageContent,
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
  const imageUrls =
    Array.isArray(message?.images) && message.images.length
      ? message.images.map((item: { image_url?: { url?: string } }) => item?.image_url?.url).filter(Boolean)
      : []
  const imageUrl = imageUrls[0] ?? null
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

  const imagesToStore = imageUrls.length ? imageUrls : [imageUrl]
  if (imagesToStore.length) {
    try {
      const { error: historyError } = await supabase.from("image_history").insert({
        user_id: authData.user.id,
        prompt,
        image_urls: imagesToStore,
        model: selectedModel,
        aspect_ratio: aspectRatio,
        resolution,
        output_format: outputFormat,
        generation_mode: generationMode,
      })
      if (historyError) {
        console.error("Failed to store image history", historyError)
      }
    } catch (error) {
      console.error("Unexpected history storage error", error)
    }
  }

  return NextResponse.json({ imageUrl, imageUrls, text })
}
