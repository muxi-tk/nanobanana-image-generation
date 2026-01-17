import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

  if (generationMode === "text-to-image") {
    imageDataUrl = null
    imageDataUrls = []
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

  const providerConfig = undefined
  const messageContent = candidateImages.length ? contentParts : finalPrompt
  const modelName = MODEL_MAP[selectedModel] ?? MODEL_MAP["nano-banana"]

  const requestOnce = async (count?: number) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: openRouterHeaders,
        body: JSON.stringify({
          model: modelName,
          modalities: ["image", "text"],
          n: count && count > 1 ? count : undefined,
          provider: providerConfig,
          messages: [
            {
              role: "user",
              content: messageContent,
            },
          ],
        }),
        signal: controller.signal,
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          result?.error?.message ||
          result?.error ||
          `OpenRouter request failed (${response.status}).`
        throw new Error(message)
      }

      const message = result?.choices?.[0]?.message
      const urls =
        Array.isArray(message?.images) && message.images.length
          ? message.images.map((item: { image_url?: { url?: string } }) => item?.image_url?.url).filter(Boolean)
          : []
      const text = typeof message?.content === "string" ? message.content : null
      return { urls, text }
    } finally {
      clearTimeout(timeout)
    }
  }

  const imageUrls: string[] = []
  let text: string | null = null
  if (selectedModel === "nano-banana" && imageCount > 1) {
    for (let i = 0; i < imageCount; i += 1) {
      try {
        const result = await requestOnce()
        if (result.urls.length) {
          imageUrls.push(result.urls[0])
        }
        if (!text && result.text) {
          text = result.text
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "OpenRouter request failed.",
            details: { index: i + 1 },
          },
          { status: 502 }
        )
      }
    }
  } else {
    try {
      const result = await requestOnce(imageCount > 1 ? imageCount : undefined)
      imageUrls.push(...result.urls)
      text = result.text
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "OpenRouter request failed." },
        { status: 502 }
      )
    }
  }

  const imageUrl = imageUrls[0] ?? null

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
  const creditMultiplier = imageCount > 1 ? imageCount : 1
  const perImageCredits =
    selectedModel === "nano-banana"
      ? 2
      : selectedModel === "nano-banana-pro"
        ? resolution === "4k"
          ? 20
          : resolution === "2k"
            ? 10
            : 6
        : resolution === "4k"
          ? 20
          : 10
  const requiredCredits = perImageCredits * creditMultiplier

  let historyId: string | null = null
  if (imagesToStore.length) {
    try {
      const hasUploadedImages = imageDataUrls.length > 0 || Boolean(imageDataUrl)
      const storedGenerationMode = hasUploadedImages ? "image-to-image" : "text-to-image"
      const { data: historyRecord, error: historyError } = await supabase
        .from("image_history")
        .insert({
          user_id: authData.user.id,
          prompt,
          image_urls: imagesToStore,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          resolution,
          output_format: outputFormat,
          generation_mode: storedGenerationMode,
          credits_per_image: perImageCredits,
          credits_total: requiredCredits,
          image_count: creditMultiplier,
        })
        .select("id")
        .single()
      if (historyError) {
        console.error("Failed to store image history", historyError)
      } else {
        historyId = historyRecord?.id ?? null
      }
    } catch (error) {
      console.error("Unexpected history storage error", error)
    }
  }

  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()
    const { data: grants, error: grantsError } = await admin
      .from("credit_grants")
      .select("id, source, credits_remaining, expires_at, created_at")
      .eq("user_id", authData.user.id)
      .gt("credits_remaining", 0)

    if (!grantsError && Array.isArray(grants) && grants.length > 0) {
      const subscriptionGrants = grants
        .filter((grant) => grant.source === "subscription" && (!grant.expires_at || grant.expires_at > nowIso))
        .sort((a, b) => {
          const aTime = a.expires_at ? new Date(a.expires_at).getTime() : Number.MAX_SAFE_INTEGER
          const bTime = b.expires_at ? new Date(b.expires_at).getTime() : Number.MAX_SAFE_INTEGER
          return aTime - bTime
        })
      const packGrants = grants
        .filter((grant) => grant.source === "credit-pack")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      let remainingToDeduct = requiredCredits
      const updates: Array<{ id: string; credits_remaining: number }> = []
      for (const grant of [...subscriptionGrants, ...packGrants]) {
        if (remainingToDeduct <= 0) break
        const available = grant.credits_remaining
        const deduction = Math.min(available, remainingToDeduct)
        updates.push({ id: grant.id, credits_remaining: available - deduction })
        remainingToDeduct -= deduction
      }

      if (updates.length) {
        await Promise.all(
          updates.map((update) =>
            admin.from("credit_grants").update({ credits_remaining: update.credits_remaining }).eq("id", update.id)
          )
        )
      }
      if (remainingToDeduct > 0) {
        console.warn("Credits deduction incomplete; insufficient balance at update time.")
      }
    } else {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle()

      const creditFields = [
        "credits",
        "credit_balance",
        "balance",
        "credit",
        "remaining_credits",
        "available_credits",
      ] as const

      let creditField: (typeof creditFields)[number] | null = null
      let currentCredits: number | null = null

      if (!profileError && profile) {
        for (const field of creditFields) {
          const value = profile[field]
          const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
          if (!Number.isNaN(parsed)) {
            creditField = field
            currentCredits = parsed
            break
          }
        }
      }

      if (currentCredits === null) {
        const meta = { ...authData.user.app_metadata, ...authData.user.user_metadata }
        const metaCredits = Number(
          meta.credits ??
            meta.credit_balance ??
            meta.balance ??
            meta.credit ??
            meta.remaining_credits ??
            meta.available_credits
        )
        currentCredits = Number.isNaN(metaCredits) ? 10 : metaCredits
      }

      const nextCredits = Math.max(0, currentCredits - requiredCredits)

      if (creditField) {
        const { error: creditError } = await admin
          .from("profiles")
          .update({ [creditField]: nextCredits })
          .eq("id", authData.user.id)
        if (creditError) {
          console.error("Failed to update credits", creditError)
        }
      } else {
        const { error: creditError } = await admin
          .from("profiles")
          .upsert({ id: authData.user.id, credits: nextCredits }, { onConflict: "id" })
        if (creditError) {
          console.error("Failed to upsert credits", creditError)
        }
      }
    }
  } catch (error) {
    console.error("Unexpected credit update error", error)
  }

  return NextResponse.json({ imageUrl, imageUrls, text, historyId })
}
