"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  Crown,
  Download,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

type ModelId = "nano-banana" | "nano-banana-pro" | "seedream-4-5"

const modelOptions: { value: ModelId; label: { en: string; zh: string }; proOnly?: boolean }[] = [
  { value: "nano-banana", label: { en: "Nano Banana", zh: "Nano Banana" } },
  { value: "nano-banana-pro", label: { en: "Nano Banana Pro", zh: "Nano Banana Pro" } },
  { value: "seedream-4-5", label: { en: "Seedream 4.5", zh: "Seedream 4.5" } },
]

const aspectRatioOptions = [
  { value: "auto", label: { en: "Auto", zh: "自动" } },
  { value: "1:1", label: { en: "Square (1:1)", zh: "正方形 (1:1)" } },
  { value: "16:9", label: { en: "Widescreen (16:9)", zh: "宽屏 (16:9)" } },
  { value: "9:16", label: { en: "Vertical (9:16)", zh: "竖屏 (9:16)" } },
  { value: "3:2", label: { en: "Photo (3:2)", zh: "照片 (3:2)" } },
  { value: "2:3", label: { en: "Portrait (2:3)", zh: "竖幅 (2:3)" } },
  { value: "3:4", label: { en: "Portrait (3:4)", zh: "竖幅 (3:4)" } },
  { value: "4:3", label: { en: "Landscape (4:3)", zh: "横幅 (4:3)" } },
  { value: "4:5", label: { en: "Social (4:5)", zh: "社媒 (4:5)" } },
  { value: "21:9", label: { en: "Ultrawide (21:9)", zh: "超宽 (21:9)" } },
]

const imageCountOptions = [
  { value: "1", label: { en: "1 Image", zh: "1 张" } },
  { value: "2", label: { en: "2 Images", zh: "2 张" }, proOnly: true },
  { value: "3", label: { en: "3 Images", zh: "3 张" }, proOnly: true },
  { value: "4", label: { en: "4 Images", zh: "4 张" }, proOnly: true },
]

const resolutionOptions = [
  { value: "1k", label: { en: "1K", zh: "1K" } },
  { value: "2k", label: { en: "2K", zh: "2K" } },
  { value: "4k", label: { en: "4K", zh: "4K" }, extra: { en: "+10 credits", zh: "+10 积分" } },
]

const outputFormatOptions = [
  { value: "png", label: { en: "PNG", zh: "PNG" } },
  { value: "jpeg", label: { en: "JPEG", zh: "JPEG" } },
  { value: "webp", label: { en: "WebP", zh: "WebP" }, seedreamOnly: true },
]

export function ImageGenerator() {
  const { locale } = useI18n()
  const localeKey = locale === "zh" ? "zh" : "en"
  const [selectedModel, setSelectedModel] = useState<ModelId>("nano-banana")
  const [aspectRatio, setAspectRatio] = useState("auto")
  const [imageCount, setImageCount] = useState("1")
  const [resolution, setResolution] = useState("1k")
  const [outputFormat, setOutputFormat] = useState("png")
  const [generationMode, setGenerationMode] = useState<"image-edit" | "text-to-image">("image-edit")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isProMember, setIsProMember] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [prompt, setPrompt] = useState("")
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; sizeLabel: string }>>([])
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  const [requiredCredits, setRequiredCredits] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const copy =
    locale === "zh"
      ? {
          upgradeVipFeatureTitle: "VIP 功能 - Pro 权限",
          invalidImage: "请上传有效的图片文件。",
          imageTooLarge: "图片过大，每张最大 10MB。",
          promptRequired: "请输入提示词。",
          loginVerifyError: "无法验证登录，请重试。",
          noImageReturned: "未返回图片，请尝试更换提示词。",
          unknownError: "发生未知错误。",
          requestFailed: (status: number) => `请求失败（${status}）。`,
          pendingDataError: "登录前保存待处理数据失败",
          promptInputTitle: "提示词输入",
          aiModelSelection: "AI 模型选择",
          selectModel: "选择模型",
          modelHint: "不同模型具备不同风格与能力。",
          proTag: "PRO",
          resolutionSettings: "分辨率设置",
          aspectRatio: "宽高比",
          selectRatio: "选择比例",
          numberOfImages: "生成数量",
          selectCount: "选择数量",
          vipTag: "VIP",
          resolution: "分辨率",
          selectResolution: "选择分辨率",
          outputFormat: "输出格式",
          selectFormat: "选择格式",
          seedreamLabel: "Seedream",
          seedreamOnlyNote1: "Seedream 4.5 支持高质量输出。",
          seedreamOnlyNote2: "支持 2K 与 4K 分辨率。",
          nanoBananaProNote1: "Nano Banana Pro 积分随分辨率递增。",
          nanoBananaProNote2: "1K: 6，2K: 10，4K: 20 积分/张。",
          otherModelNote1: "该模型支持高质量输出。",
          otherModelNote2: "4K 分辨率会额外消耗 10 积分。",
          imageToImage: "图生图",
          textToImage: "文生图",
          referenceImage: "参考图",
          addImage: "添加图片",
          maxSize: "最大 10MB",
          uploadedAlt: "已上传",
          removeImage: "移除图片",
          promptLabel: "提示词",
          promptPlaceholder: "例如：'未来城市，纳米科技驱动，金色日落光线，超细节...'",
          generateNow: (credits: number) => `立即生成（${credits} 积分）`,
          outputGallery: "输出预览",
          generatedOutputAlt: "生成结果",
          readyTitle: "准备就绪，开始生成",
          readySubtitle: "输入提示词开始创作",
          generating: "生成中...",
          insufficientTitle: "积分不足",
          insufficientBody: (needed: number, current: number) => `当前积分 ${current}，本次需要 ${needed}。`,
          insufficientCancel: "取消",
          insufficientUpgrade: "升级套餐",
          upgradeVipConfirmTitle: "升级 VIP？",
          upgradeVipConfirmBody: "该功能需要 VIP 权限，是否前往定价页升级？",
          upgradeVipConfirmCancel: "取消",
          upgradeVipConfirmConfirm: "升级 VIP",
          downloadImage: "下载图片",
          share: "分享",
          shareTo: "分享至",
          shareX: "X",
          shareFacebook: "Facebook",
          shareLinkedin: "LinkedIn",
          shareCopyLink: "复制链接",
          shareText: "由 Nano Banana 生成",
          sharePopupBlocked: "请允许浏览器打开新窗口后再试。",
          editAgain: "再次生成",
          generatedAlt: (index: number) => `生成结果 ${index + 1}`,
          progressLabel: (value: number) => `${value}%`,
          proBenefitsTitle: "Pro 会员权益",
          proBenefitsDescription: "Pro 会员解锁高级模型、更高分辨率与批量生成。",
          proBenefit1: "专属高级模型与更高输出质量。",
          proBenefit2: "优先处理，交付更快。",
          proBenefit3: "2K/4K 超清输出。",
          maybeLater: "稍后再说",
          upgradeToPro: "升级到 Pro",
          sizeNotAvailable: "N/A",
        }
      : {
          upgradeVipFeatureTitle: "VIP Feature - Pro Access",
          invalidImage: "Please upload valid image files.",
          imageTooLarge: "Image too large. Max 10MB per image.",
          promptRequired: "Please enter a prompt.",
          loginVerifyError: "Unable to verify login. Please try again.",
          noImageReturned: "No image returned. Try a different prompt.",
          unknownError: "Unknown error.",
          requestFailed: (status: number) => `Request failed (${status}).`,
          pendingDataError: "Failed to persist pending data before login",
          promptInputTitle: "Prompt Input",
          aiModelSelection: "AI Model Selection",
          selectModel: "Select a model",
          modelHint: "Different models offer unique characteristics and styles",
          proTag: "PRO",
          resolutionSettings: "Resolution Settings",
          aspectRatio: "Aspect Ratio",
          selectRatio: "Select ratio",
          numberOfImages: "Number of Images",
          selectCount: "Select count",
          vipTag: "VIP",
          resolution: "Resolution",
          selectResolution: "Select resolution",
          outputFormat: "Output Format",
          selectFormat: "Select format",
          seedreamLabel: "Seedream",
          seedreamOnlyNote1: "Seedream 4.5 supports high-quality output.",
          seedreamOnlyNote2: "Supports 2K and 4K resolutions.",
          nanoBananaProNote1: "Nano Banana Pro credits scale by resolution.",
          nanoBananaProNote2: "1K: 6, 2K: 10, 4K: 20 credits per image.",
          otherModelNote1: "High-quality output is available for this model.",
          otherModelNote2: "4K resolution consumes an extra 10 credits.",
          imageToImage: "Image to Image",
          textToImage: "Text to Image",
          referenceImage: "Reference Image",
          addImage: "Add Image",
          maxSize: "Max 10MB",
          uploadedAlt: "Uploaded",
          removeImage: "Remove image",
          promptLabel: "Prompt",
          promptPlaceholder:
            "e.g., 'A futuristic city powered by nano technology, golden hour lighting, ultra detailed...'",
          generateNow: (credits: number) => `Generate Now (${credits} Credits)`,
          outputGallery: "Output Gallery",
          generatedOutputAlt: "Generated output",
          readyTitle: "Ready for instant generation",
          readySubtitle: "Enter your prompt and unleash the power",
          generating: "Generating...",
          insufficientTitle: "Insufficient credits",
          insufficientBody: (needed: number, current: number) =>
            `You have ${current} credits. This generation needs ${needed}.`,
          insufficientCancel: "Cancel",
          insufficientUpgrade: "Upgrade plan",
          upgradeVipConfirmTitle: "Upgrade to VIP?",
          upgradeVipConfirmBody: "This feature requires VIP access. Go to pricing to upgrade?",
          upgradeVipConfirmCancel: "Cancel",
          upgradeVipConfirmConfirm: "Upgrade VIP",
          downloadImage: "Download Image",
          share: "Share",
          shareTo: "Share to",
          shareX: "X",
          shareFacebook: "Facebook",
          shareLinkedin: "LinkedIn",
          shareCopyLink: "Copy link",
          shareText: "Generated with Nano Banana",
          sharePopupBlocked: "Please allow pop-ups to open the share window.",
          editAgain: "Generate Again",
          generatedAlt: (index: number) => `Generated ${index + 1}`,
          progressLabel: (value: number) => `${value}%`,
          proBenefitsTitle: "Pro Plan Benefits",
          proBenefitsDescription:
            "Pro membership unlocks advanced models, higher resolutions, and batch generation options.",
          proBenefit1: "Exclusive advanced AI models and premium output quality.",
          proBenefit2: "Priority processing with faster delivery.",
          proBenefit3: "High-resolution output with 2K/4K ultra-HD generation.",
          maybeLater: "Maybe Later",
          upgradeToPro: "Upgrade to Pro",
          sizeNotAvailable: "N/A",
        }


  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const generateLockRef = useRef(false)
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
  useEffect(() => {
    setShareUrl(null)
  }, [generatedImageUrl, historyId])

  const shareLinks = useMemo(() => {
    if (!shareUrl) {
      return null
    }
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(copy.shareText)
    return {
      x: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    }
  }, [copy.shareText, shareUrl])

  const ensureShareUrl = async () => {
    if (shareUrl) {
      return shareUrl
    }
    if (!historyId || !generatedImageUrl) {
      return null
    }
    setShareLoading(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId, imageUrl: generatedImageUrl }),
      })
      const data = (await res.json().catch(() => null)) as { shareId?: string } | null
      if (!res.ok || !data?.shareId) {
        return null
      }
      const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const nextUrl = `${origin.replace(/\/$/, "")}/share/${data.shareId}`
      setShareUrl(nextUrl)
      return nextUrl
    } catch (err) {
      console.error("Failed to create share link", err)
      return null
    } finally {
      setShareLoading(false)
    }
  }

  const handleShareClick = async (platform: "x" | "facebook" | "linkedin") => {
    if (!generatedImageUrl) {
      return
    }
    const pendingWindow = window.open("", "_blank", "noopener,noreferrer")
    if (!pendingWindow) {
      setError(copy.sharePopupBlocked)
      return
    }
    const url = await ensureShareUrl()
    if (!url) {
      pendingWindow?.close()
      return
    }
    const targetUrl = shareLinks
      ? shareLinks[platform]
      : platform === "x"
        ? `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(copy.shareText)}`
        : platform === "facebook"
          ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    if (pendingWindow) {
      pendingWindow.location.href = targetUrl
    }
  }

  const handleCopyShareLink = async () => {
    const url = await ensureShareUrl()
    if (!url) {
      return
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = url
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
    } catch (err) {
      console.error("Failed to copy share link", err)
    }
  }

  const clearProgressInterval = () => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const refreshCredits = async (nextCredits?: number | null) => {
    if (typeof nextCredits === "number") {
      setCredits(nextCredits)
      window.dispatchEvent(new CustomEvent("nb:credits", { detail: { credits: nextCredits } }))
    }
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" })
      if (!res.ok) {
        return
      }
      const data = (await res.json().catch(() => null)) as { credits?: number } | null
      if (typeof data?.credits === "number") {
        setCredits(data.credits)
        window.dispatchEvent(new CustomEvent("nb:credits", { detail: { credits: data.credits } }))
      }
    } catch (err) {
      console.error("Failed to refresh credits", err)
    }
  }

  const needsUpgrade = () => !isLoggedIn || !isProMember

  const handleModelChange = (value: ModelId) => {
    const nextModel = modelOptions.find((option) => option.value === value)
    if (nextModel?.proOnly && needsUpgrade()) {
      setUpgradeOpen(true)
      return
    }
    setSelectedModel(value)
  }

  const handleImageCountChange = (value: string) => {
    const option = imageCountOptions.find((item) => item.value === value)
    if (option?.proOnly && needsUpgrade()) {
      setUpgradeOpen(true)
      return
    }
    setImageCount(value)
  }

  const handleResolutionChange = (value: string) => {
    setResolution(value)
  }

  const computeCredits = () => {
    const count = Number.parseInt(imageCount, 10)
    const imageMultiplier = Number.isNaN(count) ? 1 : count

    if (selectedModel === "nano-banana") {
      return 2 * imageMultiplier
    }

    if (selectedModel === "nano-banana-pro") {
      const perImage = resolution === "4k" ? 20 : resolution === "2k" ? 10 : 6
      return perImage * imageMultiplier
    }

    const perImage = resolution === "4k" ? 20 : 10
    return perImage * imageMultiplier
  }

  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("nb_pending_prompt")
    const storedImage = sessionStorage.getItem("nb_pending_image")
    if (storedPrompt) {
      setPrompt(storedPrompt)
      sessionStorage.removeItem("nb_pending_prompt")
    }
    if (storedImage) {
      setUploadedImages([{ id: "restored", url: storedImage, sizeLabel: copy.sizeNotAvailable }])
      sessionStorage.removeItem("nb_pending_image")
    }

    return () => {
      clearProgressInterval()
    }
  }, [copy.sizeNotAvailable])

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
    const fetchAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" })
        if (!res.ok) {
          setIsLoggedIn(false)
          setIsProMember(false)
          setCredits(null)
          return
        }
        const data = (await res.json().catch(() => null)) as { isProMember?: boolean; credits?: number } | null
        setIsLoggedIn(true)
        setIsProMember(Boolean(data?.isProMember))
        setCredits(typeof data?.credits === "number" ? data.credits : 10)
      } catch {
        setIsLoggedIn(false)
        setIsProMember(false)
        setCredits(null)
      }
    }

    fetchAuthStatus()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) {
      return
    }

    const remainingSlots = maxReferenceImages - uploadedImages.length
    const acceptedFiles = files.slice(0, remainingSlots)
    const invalidFile = acceptedFiles.find((file) => !file.type.startsWith("image/"))
    if (invalidFile) {
      setError(copy.invalidImage)
      return
    }
    const oversizeFile = acceptedFiles.find((file) => file.size > 10 * 1024 * 1024)
    if (oversizeFile) {
      setError(copy.imageTooLarge)
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
    if (generateLockRef.current) {
      return
    }
    generateLockRef.current = true
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError(copy.promptRequired)
      generateLockRef.current = false
      return
    }

    setError(null)
    setIsGenerating(true)
    setShareUrl(null)
    setHistoryId(null)

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
        console.error(copy.pendingDataError, err)
      }
      window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
      setIsGenerating(false)
      generateLockRef.current = false
      return
    }

    if (!authRes.ok) {
      setError(copy.loginVerifyError)
      setIsGenerating(false)
      generateLockRef.current = false
      return
    }
    const authData = (await authRes.json().catch(() => null)) as { credits?: number } | null
    const availableCredits = typeof authData?.credits === "number" ? authData.credits : credits
    if (typeof authData?.credits === "number") {
      setCredits(authData.credits)
    }
    const required = computeCredits()
    if (typeof availableCredits === "number" && availableCredits < required) {
      setRequiredCredits(required)
      setInsufficientOpen(true)
      setIsGenerating(false)
      generateLockRef.current = false
      return
    }

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
        | { imageUrl?: string; imageUrls?: string[]; error?: string; historyId?: string | null }
        | null

      if (res.status === 401) {
        try {
          sessionStorage.setItem("nb_pending_prompt", prompt)
          if (uploadedImages[0]?.url) {
            sessionStorage.setItem("nb_pending_image", uploadedImages[0].url)
          }
        } catch (err) {
          console.error(copy.pendingDataError, err)
        }
        window.location.assign(`/login?next=${encodeURIComponent(nextUrl)}`)
        return
      }

      if (!res.ok) {
        setError(data?.error || copy.requestFailed(res.status))
        setProgress(0)
        return
      }

      const images = data?.imageUrls?.length ? data.imageUrls : data?.imageUrl ? [data.imageUrl] : []
      if (!images.length) {
        setError(copy.noImageReturned)
        setProgress(0)
        return
      }

      setGeneratedImages(images)
      setGeneratedImageUrl(images[0])
      setHistoryId(typeof data?.historyId === "string" ? data.historyId : null)
      setProgress(100)
      if (typeof availableCredits === "number") {
        refreshCredits(Math.max(0, availableCredits - required))
      } else {
        refreshCredits()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unknownError)
      setProgress(0)
    } finally {
      clearProgressInterval()
      setIsGenerating(false)
      generateLockRef.current = false
    }
  }

  return (
    <section id="generator" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {copy.promptInputTitle}
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{copy.aiModelSelection}</label>
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={copy.selectModel} />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex w-full items-center justify-between gap-3">
                            <span>{option.label[localeKey]}</span>
                            {option.proOnly ? (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <Crown className="h-3 w-3" />
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{copy.modelHint}</p>
                </div>

                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      {copy.resolutionSettings}
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {modelOptions.find((option) => option.value === selectedModel)?.label[localeKey]}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{copy.aspectRatio}</label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder={copy.selectRatio} />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label[localeKey]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{copy.numberOfImages}</label>
                      <Select value={imageCount} onValueChange={handleImageCountChange}>
                      <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder={copy.selectCount} />
                        </SelectTrigger>
                        <SelectContent>
                          {imageCountOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex w-full items-center justify-between gap-3">
                                <span>{option.label[localeKey]}</span>
                                {option.proOnly ? (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                                    <Crown className="h-3 w-3" />
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
                        <label className="text-xs font-medium text-muted-foreground">{copy.resolution}</label>
                        <Select value={resolution} onValueChange={handleResolutionChange}>
                          <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                            <SelectValue placeholder={copy.selectResolution} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableResolutions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{option.label[localeKey]}</span>
                                  {option.extra ? (
                                    <span className="text-[10px] font-semibold text-amber-700">
                                      {option.extra[localeKey]}
                                    </span>
                                  ) : null}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{copy.outputFormat}</label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="h-12 w-full rounded-lg border-2 border-foreground/20 bg-background">
                          <SelectValue placeholder={copy.selectFormat} />
                        </SelectTrigger>
                        <SelectContent>
                          {outputFormatOptions.map((option) => {
                            const disabled = option.seedreamOnly && selectedModel !== "seedream-4-5"
                            return (
                              <SelectItem key={option.value} value={option.value} disabled={disabled}>
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{option.label[localeKey]}</span>
                                  {disabled ? (
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                      {copy.seedreamLabel}
                                    </span>
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
                      <p>{copy.seedreamOnlyNote1}</p>
                      <p>{copy.seedreamOnlyNote2}</p>
                    </div>
                  ) : selectedModel === "nano-banana-pro" ? (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{copy.nanoBananaProNote1}</p>
                      <p>{copy.nanoBananaProNote2}</p>
                    </div>
                  ) : selectedModel !== "nano-banana" ? (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{copy.otherModelNote1}</p>
                      <p>{copy.otherModelNote2}</p>
                    </div>
                  ) : null}
                </div>

                <Tabs
                  value={generationMode}
                  onValueChange={(value) => setGenerationMode(value as "image-edit" | "text-to-image")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image-edit">{copy.imageToImage}</TabsTrigger>
                    <TabsTrigger value="text-to-image">{copy.textToImage}</TabsTrigger>
                  </TabsList>
                </Tabs>

                {generationMode === "image-edit" ? (
                  <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          {copy.referenceImage}
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
                            <img src={image.url} alt={copy.uploadedAlt} className="h-full w-full object-cover" />
                            <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                              {image.sizeLabel}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="absolute right-2 top-2 h-6 w-6 rounded-full"
                              onClick={() => handleRemoveImage(image.id)}
                              aria-label={copy.removeImage}
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
                              <p className="text-xs font-medium">{copy.addImage}</p>
                              <p className="text-[10px] text-muted-foreground">{copy.maxSize}</p>
                            </div>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{copy.promptLabel}</label>
                  <Textarea
                    placeholder={copy.promptPlaceholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                  onClick={generate}
                >
                  <Zap className="h-4 w-4" />
                  {isGenerating ? copy.generating : copy.generateNow(computeCredits())}
                </Button>
              </div>
            </Card>

            {/* Output Section */}
            <Card className="p-6 bg-muted/50">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                {copy.outputGallery}
              </h3>

              <div className="space-y-4">
                <div className="relative flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg overflow-hidden bg-background">
                  {generatedImageUrl ? (
                    <img
                      src={generatedImageUrl}
                      alt={copy.generatedOutputAlt}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">{copy.readyTitle}</p>
                      <p className="text-sm text-muted-foreground mt-2">{copy.readySubtitle}</p>
                    </div>
                  )}

                  {isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <div className="w-full max-w-sm px-6">
                        <p className="text-sm font-medium mb-3 text-center">{copy.generating}</p>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {copy.progressLabel(progress)}
                        </p>
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
                        <span className="whitespace-nowrap">{copy.downloadImage}</span>
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
                            <span className="truncate">{copy.share}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48">
                          <DropdownMenuLabel>{copy.shareTo}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              void handleShareClick("x")
                            }}
                            disabled={shareLoading || !historyId}
                          >
                            {copy.shareX}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              void handleShareClick("facebook")
                            }}
                            disabled={shareLoading || !historyId}
                          >
                            {copy.shareFacebook}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              void handleShareClick("linkedin")
                            }}
                            disabled={shareLoading || !historyId}
                          >
                            {copy.shareLinkedin}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              void handleCopyShareLink()
                            }}
                            disabled={shareLoading || !historyId}
                          >
                            {copy.shareCopyLink}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        type="button"
                        disabled={isGenerating}
                        onClick={generate}
                        className="w-full bg-amber-100 text-amber-900 hover:bg-amber-200 justify-center min-w-0 overflow-hidden sm:flex-[0.95]"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="truncate">{copy.editAgain}</span>
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
                            <img src={imageUrl} alt={copy.generatedAlt(index)} className="h-24 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <Dialog open={insufficientOpen} onOpenChange={setInsufficientOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{copy.insufficientTitle}</DialogTitle>
                <DialogDescription>
                  {copy.insufficientBody(requiredCredits, credits ?? 0)}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-3 sm:justify-center">
                <Button type="button" variant="outline" onClick={() => setInsufficientOpen(false)}>
                  {copy.insufficientCancel}
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.assign("/pricing")}
                >
                  {copy.insufficientUpgrade}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.upgradeVipConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{copy.upgradeVipConfirmBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:justify-center">
                <AlertDialogCancel className="border-border/60">
                  {copy.upgradeVipConfirmCancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.assign("/pricing")}
                >
                  {copy.upgradeVipConfirmConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  )
}
