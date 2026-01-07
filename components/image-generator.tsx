"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Download, ImageIcon, Pencil, Plus, Share2, Sparkles, X, Zap } from "lucide-react"

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressIntervalRef = useRef<number | null>(null)

  const clearProgressInterval = () => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("nb_pending_prompt")
    const storedImage = sessionStorage.getItem("nb_pending_image")
    if (storedPrompt) {
      setPrompt(storedPrompt)
      sessionStorage.removeItem("nb_pending_prompt")
    }
    if (storedImage) {
      setUploadedImagePreviewUrl(storedImage)
      sessionStorage.removeItem("nb_pending_image")
    }

    return () => {
      clearProgressInterval()
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image too large. Max 10MB.")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleRemoveImage = () => {
    setUploadedImagePreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
        if (uploadedImagePreviewUrl) {
          sessionStorage.setItem("nb_pending_image", uploadedImagePreviewUrl)
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
          imageDataUrl: uploadedImagePreviewUrl,
        }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout))
      const data = (await res.json().catch(() => null)) as
        | { imageUrl?: string; error?: string }
        | null

      if (res.status === 401) {
        try {
          sessionStorage.setItem("nb_pending_prompt", prompt)
          if (uploadedImagePreviewUrl) {
            sessionStorage.setItem("nb_pending_image", uploadedImagePreviewUrl)
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
        return
      }

      if (!data?.imageUrl) {
        setError("No image returned. Try a different prompt.")
        setProgress(0)
        return
      }

      setGeneratedImageUrl(data.imageUrl)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.")
      setProgress(0)
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
                Prompt Engine
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Add Image (optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={fileInputRef}
                      id="image-upload"
                    />
                    <div className="h-40 border-2 border-dashed border-border/70 rounded-lg overflow-hidden bg-background">
                      {uploadedImagePreviewUrl ? (
                        <div className="relative h-full w-full">
                          <img
                            src={uploadedImagePreviewUrl}
                            alt="Uploaded"
                            className="h-full w-full object-contain bg-muted/20"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex h-full w-full flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60">
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="text-center leading-tight">
                            <p className="text-sm font-medium">Add Image</p>
                            <p className="text-xs text-muted-foreground">Max 10MB</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Main Prompt</label>
                  <Textarea
                    placeholder="e.g., 'Place the person in a snowy mountain landscape' or 'Change background to sunset beach'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={isGenerating}
                  onClick={generate}
                >
                  <Zap className="h-4 w-4" />
                  Generate Now
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
                      <div className="text-6xl mb-4">🍌</div>
                      <p className="text-muted-foreground">Ready for instant generation</p>
                      <p className="text-sm text-muted-foreground mt-2">Enter your prompt and generate an image</p>
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
                  <div className="flex flex-col sm:flex-row gap-3">
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
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
