"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Crown, Download, ImageIcon, Pencil, Plus, Share2, SlidersHorizontal, Sparkles, X, Zap } from "lucide-react"

type ModelId = "nano-banana" | "nano-banana-pro" | "seedream-4-5"

const modelOptions: { value: ModelId; label: string; proOnly?: boolean }[] = [
  { value: "nano-banana", label: "Nano Banana" },
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
  { value: "seedream-4-5", label: "Seedream 4.5", proOnly: true },
]

const aspectRatioOptions = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "9:16", label: "Vertical (9:16)" },
  { value: "3:2", label: "Photo (3:2)" },
  { value: "2:3", label: "Portrait (2:3)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "4:3", label: "Landscape (4:3)" },
  { value: "4:5", label: "Social (4:5)" },
  { value: "21:9", label: "Ultrawide (21:9)" },
]

const imageCountOptions = [
  { value: "1", label: "1 Image(s)" },
  { value: "2", label: "2 Image(s)", proOnly: true },
  { value: "3", label: "3 Image(s)", proOnly: true },
  { value: "4", label: "4 Image(s)", proOnly: true },
]

const resolutionOptions = [
  { value: "1k", label: "1K" },
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K", extra: "+10 credits" },
]

const outputFormatOptions = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP", seedreamOnly: true },
]

export function ImageGenerator() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("nano-banana")
  const [aspectRatio, setAspectRatio] = useState("auto")
  const [imageCount, setImageCount] = useState("1")
  const [resolution, setResolution] = useState("1k")
  const [outputFormat, setOutputFormat] = useState("png")
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeTitle, setUpgradeTitle] = useState("Seedream 4.5 - Pro Feature")
  const [generationMode, setGenerationMode] = useState<"image-edit" | "text-to-image">("image-edit")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isProMember, setIsProMember] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; sizeLabel: string }>>([])
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const titleFlashIntervalRef = useRef<number | null>(null)
  const titleFlashTimeoutRef = useRef<number | null>(null)
  const originalTitleRef = useRef<string | null>(null)
  const imageCountValue = Number.parseInt(imageCount, 10)
  const safeImageCount = Number.isNaN(imageCountValue) || imageCountValue < 1 ? 1 : imageCountValue
  const availableResolutions =
    selectedModel === "seedream-4-5"
      ? resolutionOptions.filter((option) => option.value !== "1k")
      : resolutionOptions
  const maxReferenceImages =
    selectedModel === "nano-banana"
      ? 3
      : selectedModel === "nano-banana-pro"
        ? 14
        : Math.max(0, Math.min(14, 15 - safeImageCount))

  const clearProgressInterval = () => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const stopTitleFlash = () => {
    if (titleFlashIntervalRef.current !== null) {
      window.clearInterval(titleFlashIntervalRef.current)
      titleFlashIntervalRef.current = null
    }
    if (titleFlashTimeoutRef.current !== null) {
      window.clearTimeout(titleFlashTimeoutRef.current)
      titleFlashTimeoutRef.current = null
    }
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current
      originalTitleRef.current = null
    }
  }

  const startTitleFlash = (message: string) => {
    if (typeof document === "undefined" || !document.hidden) {
      return
    }
    stopTitleFlash()
    originalTitleRef.current = document.title
    let showAlt = false
    titleFlashIntervalRef.current = window.setInterval(() => {
      document.title = showAlt ? message : originalTitleRef.current || message
      showAlt = !showAlt
    }, 800)
    titleFlashTimeoutRef.current = window.setTimeout(stopTitleFlash, 8000)
  }

  const playNotifySound = () => {
    if (typeof window === "undefined") {
      return
    }
    const AudioContextClass =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      return
    }
    try {
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = 880
      gain.gain.value = 0.06
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      const stopAt = context.currentTime + 1
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)
      oscillator.stop(stopAt)
      oscillator.onended = () => {
        context.close()
      }
    } catch (err) {
      console.warn("Notification sound failed", err)
    }
  }

  const notifyCompletion = (status: "success" | "error") => {
    if (!notifyEnabled) {
      return
    }
    const title = status === "success" ? "Generation complete" : "Generation failed"
    const body = status === "success" ? "Your images are ready." : "Check the error message for details."
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body })
      } catch (err) {
        console.warn("Notification failed", err)
      }
    }
    startTitleFlash(title)
    playNotifySound()
  }

  const needsUpgrade = () => !isLoggedIn || !isProMember

  const handleModelChange = (value: ModelId) => {
    const nextModel = modelOptions.find((option) => option.value === value)
    if (nextModel?.proOnly && needsUpgrade()) {
      setUpgradeTitle(`${nextModel.label} - Pro Feature`)
      setUpgradeOpen(true)
      return
    }
    setSelectedModel(value)
  }

  const handleImageCountChange = (value: string) => {
    const option = imageCountOptions.find((item) => item.value === value)
    if (option?.proOnly && needsUpgrade()) {
      setUpgradeTitle("VIP Feature - Pro Access")
      setUpgradeOpen(true)
      return
    }
    setImageCount(value)
  }

  const handleResolutionChange = (value: string) => {
    if (value !== "1k" && needsUpgrade()) {
      setUpgradeTitle("VIP Resolution - Pro Access")
      setUpgradeOpen(true)
      return
    }
    setResolution(value)
  }

  const computeCredits = () => {
    const count = Number.parseInt(imageCount, 10)
    const imageMultiplier = Number.isNaN(count) ? 1 : count
    const baseCredits: Record<ModelId, number> = {
      "nano-banana": 6,
      "nano-banana-pro": 8,
      "seedream-4-5": 10,
    }
    const base = baseCredits[selectedModel]
    const resolutionExtra = selectedModel === "nano-banana" ? 0 : resolution === "4k" ? 10 : 0
    return base * imageMultiplier + resolutionExtra
  }

  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("nb_pending_prompt")
    const storedImage = sessionStorage.getItem("nb_pending_image")
    if (storedPrompt) {
      setPrompt(storedPrompt)
      sessionStorage.removeItem("nb_pending_prompt")
    }
    if (storedImage) {
      setUploadedImages([{ id: "restored", url: storedImage, sizeLabel: "N/A" }])
      sessionStorage.removeItem("nb_pending_image")
    }

    return () => {
      clearProgressInterval()
      stopTitleFlash()
    }
  }, [])

  useEffect(() => {
    setUploadedImages((prev) => prev.slice(0, maxReferenceImages))
  }, [maxReferenceImages])

  useEffect(() => {
    if (selectedModel === "seedream-4-5" && resolution === "1k") {
      setResolution("2k")
    }
  }, [resolution, selectedModel])

  useEffect(() => {
    if (outputFormat === "webp" && selectedModel !== "seedream-4-5") {
      setOutputFormat("png")
    }
  }, [outputFormat, selectedModel])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        stopTitleFlash()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      stopTitleFlash()
    }
  }, [])

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" })
        if (!res.ok) {
          setIsLoggedIn(false)
          setIsProMember(false)
          return
        }
        const data = (await res.json().catch(() => null)) as { isProMember?: boolean } | null
        setIsLoggedIn(true)
        setIsProMember(Boolean(data?.isProMember))
      } catch {
        setIsLoggedIn(false)
        setIsProMember(false)
      }
    }

    fetchAuthStatus()
  }, [])

  const handleNotifyToggle = async (checked: boolean) => {
    setNotifyStatus(null)
    if (!checked) {
      setNotifyEnabled(false)
      return
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyStatus("Browser notifications are not supported in this browser.")
      setNotifyEnabled(false)
      return
    }
    if (Notification.permission === "granted") {
      setNotifyEnabled(true)
      return
    }
    if (Notification.permission === "denied") {
      setNotifyStatus("Notifications are blocked in your browser settings.")
      setNotifyEnabled(false)
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setNotifyEnabled(true)
    } else {
      setNotifyStatus("Notification permission was not granted.")
      setNotifyEnabled(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) {
      return
    }

    const remainingSlots = maxReferenceImages - uploadedImages.length
    const acceptedFiles = files.slice(0, remainingSlots)
    const invalidFile = acceptedFiles.find((file) => !file.type.startsWith("image/"))
    if (invalidFile) {
      setError("Please upload valid image files.")
      return
    }
    const oversizeFile = acceptedFiles.find((file) => file.size > 10 * 1024 * 1024)
    if (oversizeFile) {
      setError("Image too large. Max 10MB per image.")
      return
    }

    const toDataUrl = (file: File) =>
      new Promise<{ url: string; sizeLabel: string }>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const sizeMb = file.size / (1024 * 1024)
          resolve({ url: reader.result as string, sizeLabel: `${sizeMb.toFixed(2)} MB` })
        }
        reader.readAsDataURL(file)
      })

    const results = await Promise.all(acceptedFiles.map(toDataUrl))
    const nextImages = results.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      url: item.url,
      sizeLabel: item.sizeLabel,
    }))
    setUploadedImages((prev) => [...prev, ...nextImages])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((item) => item.id !== id))
    setError(null)
  }

  const startFakeProgress = () => {
    clearProgressInterval()
    setProgress(0)
    let current = 0
    progressIntervalRef.current = window.setInterval(() => {
      const easedIncrement = Math.max(1, Math.round((99 - current) * 0.06))
      current = Math.min(99, current + easedIncrement)
      setProgress(current)
    }, 200)
  }

  const generate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError("Please enter a prompt.")
      return
    }

    setError(null)

    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    // Pre-check auth to avoid hitting the generate endpoint when logged out.
    const authRes = await fetch("/api/auth/status", { cache: "no-store" })
    if (authRes.status === 401) {
      try {
        sessionStorage.setItem("nb_pending_prompt", prompt)
        if (uploadedImages[0]?.url) {
          sessionStorage.setItem("nb_pending_image", uploadedImages[0].url)
        }
      } catch (err) {
        console.error("Failed to persist pending data before login", err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      return
    }

    if (!authRes.ok) {
      setError("Unable to verify login. Please try again.")
      return
    }

    setIsGenerating(true)
    startFakeProgress()

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 180_000)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          imageDataUrl: generationMode === "text-to-image" ? null : uploadedImages[0]?.url ?? null,
          imageDataUrls: generationMode === "text-to-image" ? [] : uploadedImages.map((image) => image.url),
          model: selectedModel,
          aspectRatio,
          imageCount,
          resolution,
          outputFormat,
          generationMode,
        }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout))
      const data = (await res.json().catch(() => null)) as
        | { imageUrl?: string; imageUrls?: string[]; error?: string }
        | null

      if (res.status === 401) {
        try {
          sessionStorage.setItem("nb_pending_prompt", prompt)
          if (uploadedImages[0]?.url) {
            sessionStorage.setItem("nb_pending_image", uploadedImages[0].url)
          }
        } catch (err) {
          console.error("Failed to persist pending data before login", err)
        }
        window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
        return
      }

      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status}).`)
        setProgress(0)
        notifyCompletion("error")
        return
      }

      const images = data?.imageUrls?.length ? data.imageUrls : data?.imageUrl ? [data.imageUrl] : []
      if (!images.length) {
        setError("No image returned. Try a different prompt.")
        setProgress(0)
        notifyCompletion("error")
        return
      }

      setGeneratedImages(images)
      setGeneratedImageUrl(images[0])
      setProgress(100)
      notifyCompletion("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.")
      setProgress(0)
      notifyCompletion("error")
    } finally {
      clearProgressInterval()
      setIsGenerating(false)
    }
  }

  return (
    <section id="generator" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Get Started</h2>
            <p className="text-lg text-muted-foreground text-balance">
              Experience the power of AI-powered natural language image editing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Prompt Input
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Model Selection</label>
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex w-full items-center justify-between gap-3">
                            <span>{option.label}</span>
                            {option.proOnly ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                PRO
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Different models offer unique characteristics and styles
                  </p>
                </div>

                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      Resolution Settings
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {modelOptions.find((option) => option.value === selectedModel)?.label}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder="Select ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Number of Images</label>
                      <Select value={imageCount} onValueChange={handleImageCountChange}>
                      <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                        <SelectContent>
                          {imageCountOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex w-full items-center justify-between gap-3">
                                <span>{option.label}</span>
                                {option.proOnly ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    VIP
                                  </span>
                                ) : null}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedModel !== "nano-banana" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Resolution</label>
                        <Select value={resolution} onValueChange={handleResolutionChange}>
                          <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                            <SelectValue placeholder="Select resolution" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableResolutions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{option.label}</span>
                                  {option.extra ? (
                                    <span className="text-[10px] font-semibold text-amber-700">{option.extra}</span>
                                  ) : null}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Output Format</label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {outputFormatOptions.map((option) => {
                            const disabled = option.seedreamOnly && selectedModel !== "seedream-4-5"
                            return (
                              <SelectItem key={option.value} value={option.value} disabled={disabled}>
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{option.label}</span>
                                  {disabled ? (
                                    <span className="text-[10px] font-semibold text-muted-foreground">Seedream</span>
                                  ) : null}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                  ) : null}
                  {selectedModel === "seedream-4-5" ? (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Seedream 4.5 is available to Pro members only.</p>
                      <p>4K resolution consumes an extra 10 credits.</p>
                    </div>
                  ) : selectedModel !== "nano-banana" ? (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>High-quality output is available for this model.</p>
                      <p>4K resolution consumes an extra 10 credits.</p>
                    </div>
                  ) : null}
                </div>

                <Tabs
                  value={generationMode}
                  onValueChange={(value) => setGenerationMode(value as "image-edit" | "text-to-image")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image-edit">Image Edit</TabsTrigger>
                    <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
                  </TabsList>
                </Tabs>

                {generationMode === "image-edit" ? (
                  <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          Reference Image
                        <span className="text-xs text-muted-foreground">
                          {uploadedImages.length}/{maxReferenceImages}
                        </span>
                      </div>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          ref={fileInputRef}
                          id="image-upload"
                          multiple
                        />
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedImages.map((image) => (
                          <div
                            key={image.id}
                            className="relative aspect-square overflow-hidden rounded-lg border border-primary/40 bg-muted/10"
                          >
                            <img src={image.url} alt="Uploaded" className="h-full w-full object-cover" />
                            <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                              {image.sizeLabel}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="absolute right-2 top-2 h-6 w-6 rounded-full"
                              onClick={() => handleRemoveImage(image.id)}
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {uploadedImages.length < maxReferenceImages ? (
                          <button
                            type="button"
                            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-background text-center transition-colors hover:bg-secondary/50"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-center leading-tight">
                              <p className="text-xs font-medium">Add Image</p>
                              <p className="text-[10px] text-muted-foreground">Max 10MB</p>
                            </div>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt</label>
                  <Textarea
                    placeholder="e.g., 'A futuristic city powered by nano technology, golden hour lighting, ultra detailed...'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={notifyEnabled}
                      onChange={(e) => handleNotifyToggle(e.target.checked)}
                      disabled={isGenerating}
                    />
                    Notify me when complete
                  </label>
                  {notifyStatus ? <p className="text-xs text-muted-foreground">{notifyStatus}</p> : null}
                </div>

                <Button
                  className="h-12 w-full rounded-full bg-amber-300 text-white hover:bg-amber-400"
                  size="lg"
                  disabled={isGenerating}
                  onClick={generate}
                >
                  <Zap className="h-4 w-4" />
                  Generate Now ({computeCredits()} Credits)
                </Button>
              </div>
            </Card>

            {/* Output Section */}
            <Card className="p-6 bg-muted/50">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Output Gallery
              </h3>

              <div className="space-y-4">
                <div className="relative flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg overflow-hidden bg-background">
                  {generatedImageUrl ? (
                    <img
                      src={generatedImageUrl}
                      alt="Generated output"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Ready for instant generation</p>
                      <p className="text-sm text-muted-foreground mt-2">Enter your prompt and unleash the power</p>
                    </div>
                  )}

                  {isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <div className="w-full max-w-sm px-6">
                        <p className="text-sm font-medium mb-3 text-center">Generating...</p>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground mt-2 text-center">{progress}%</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {generatedImageUrl ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      variant="outline"
                      aria-disabled={isGenerating}
                      className={[
                        "w-full justify-center min-w-0 overflow-hidden sm:flex-[1.35]",
                        isGenerating ? "pointer-events-none opacity-50" : "",
                      ].join(" ")}
                    >
                      <a href={generatedImageUrl} download="nano-banana.png" aria-disabled={isGenerating}>
                        <Download className="h-4 w-4" />
                        <span className="whitespace-nowrap">Download Image</span>
                      </a>
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            disabled={isGenerating}
                            className="w-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 justify-center min-w-0 overflow-hidden sm:flex-[0.8]"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="truncate">Share</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48">
                          <DropdownMenuLabel>Share to</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            WeChat (coming soon)
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            XiaoHongShu (coming soon)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        type="button"
                        disabled={isGenerating}
                        onClick={generate}
                        className="w-full bg-amber-100 text-amber-900 hover:bg-amber-200 justify-center min-w-0 overflow-hidden sm:flex-[0.95]"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="truncate">Edit Again</span>
                      </Button>
                    </div>

                    {generatedImages.length > 1 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {generatedImages.map((imageUrl, index) => (
                          <button
                            key={`${imageUrl}-${index}`}
                            type="button"
                            onClick={() => setGeneratedImageUrl(imageUrl)}
                            className={cn(
                              "overflow-hidden rounded-lg border-2 transition",
                              imageUrl === generatedImageUrl ? "border-primary" : "border-transparent"
                            )}
                          >
                            <img src={imageUrl} alt={`Generated ${index + 1}`} className="h-24 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
            <DialogContent className="border-amber-200 bg-amber-50/70">
              <DialogHeader className="gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/70 text-amber-700">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <DialogTitle>{upgradeTitle}</DialogTitle>
                    <DialogDescription>
                      Pro membership unlocks advanced models, higher resolutions, and batch generation options.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="rounded-lg border border-amber-200/70 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Pro Plan Benefits</p>
                <ul className="mt-3 space-y-2 text-sm text-amber-800/80">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-amber-600" />
                    Exclusive advanced AI models and premium output quality.
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 text-amber-600" />
                    Priority processing with faster delivery.
                  </li>
                  <li className="flex items-start gap-2">
                    <ImageIcon className="mt-0.5 h-4 w-4 text-amber-600" />
                    High-resolution output with 2K/4K ultra-HD generation.
                  </li>
                </ul>
              </div>
              <DialogFooter className="gap-3 sm:justify-center">
                <Button type="button" variant="outline" onClick={() => setUpgradeOpen(false)}>
                  Maybe Later
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.assign("/pricing?view=subscriptions&cycle=yearly")}
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
