"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  History,
  PanelLeftIcon,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  Trash2,
  Eye,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useI18n } from "@/components/i18n-provider"
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
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type HistoryRecord = {
  id: string
  created_at: string
  prompt: string | null
  image_urls: string[] | null
  model: string | null
  aspect_ratio: string | null
  resolution: string | null
  output_format: string | null
  generation_mode: string | null
  credits_per_image?: number | null
  credits_total?: number | null
  image_count?: number | null
}

type HistoryImage = {
  id: string
  recordId: string
  url: string
  createdAt: string
  prompt: string
  model?: string | null
  generationMode?: string | null
  resolution?: string | null
  aspectRatio?: string | null
  outputFormat?: string | null
  creditsPerImage?: number | null
}

const modelLabels: Record<string, string> = {
  "nano-banana": "Nano Banana",
  "nano-banana-pro": "Nano Banana Pro",
  "seedream-4-5": "Seedream 4.5",
}

const getPromptTitle = (value: string | null | undefined, fallback: string) => {
  const prompt = value?.trim()
  if (!prompt) {
    return fallback
  }
  return prompt.length > 80 ? `${prompt.slice(0, 80)}...` : prompt
}

const normalizeGenerationMode = (value: string | null | undefined) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase().replace(/_/g, "-")
  if (["image-edit", "image-to-image", "image2image", "img2img", "img-to-img"].includes(normalized)) {
    return "image-edit"
  }
  if (["text-to-image", "text2image", "txt2img", "t2i"].includes(normalized)) {
    return "text-to-image"
  }
  return normalized
}

function SidebarLogoToggle() {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const tooltipHidden = !isCollapsed
  const tooltip = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle Sidebar"
        >
          <Logo className="absolute inset-0 m-auto h-4 w-4 text-foreground transition-opacity group-data-[collapsible=icon]:block group-data-[collapsible=icon]:group-hover:opacity-0" />
          <PanelLeftIcon className="absolute inset-0 m-auto hidden h-4 w-4 text-foreground opacity-0 transition-opacity group-data-[collapsible=icon]:block group-data-[collapsible=icon]:group-hover:opacity-100" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={tooltipHidden}>
        打开边栏
      </TooltipContent>
    </Tooltip>
  )
  if (!isCollapsed) {
    return (
      <>
        <div className="flex items-center">
          <Logo className="h-4 w-4 text-foreground" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="inline-flex" />
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            关闭边栏
          </TooltipContent>
        </Tooltip>
      </>
    )
  }
  return tooltip
}

export function HistoryClient() {
  const pathname = usePathname()
  const [items, setItems] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [selectedImage, setSelectedImage] = useState<HistoryImage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HistoryImage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const { t } = useI18n()
  const { toast } = useToast()
  const getDisplayGenerationLabel = (value: string | null | undefined) => {
    const normalized = normalizeGenerationMode(value)
    if (normalized === "image-edit") return t("historyTypeImageEdit")
    if (normalized === "text-to-image") return t("historyTypeText")
    return normalized ?? ""
  }
  const formatDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return t("historyUnknownDate")
    }
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, dateFilter])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search.trim()) {
          params.set("q", search.trim())
        }
        if (typeFilter !== "all") {
          params.set("type", typeFilter)
        }
        if (dateFilter !== "all") {
          params.set("date", dateFilter)
        }
        params.set("page", page.toString())
        params.set("page_size", pageSize.toString())
        const res = await fetch(`/api/history?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (res.status === 401) {
          if (!isMounted) return
          setItems([])
          setTotal(0)
          setError(t("historyUnauthorized"))
          return
        }
        if (!res.ok) {
          if (!isMounted) return
          setError(t("historyError"))
          setItems([])
          setTotal(0)
          return
        }
        const data = (await res.json().catch(() => null)) as
          | { items?: HistoryRecord[]; total?: number }
          | null
        if (!isMounted) return
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(typeof data?.total === "number" ? data.total : 0)
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return
        }
        console.error("History fetch failed", err)
        if (!isMounted) return
        setError(t("historyError"))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(fetchHistory, 250)
    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [dateFilter, page, pageSize, search, t, typeFilter])

  const flattened = useMemo<HistoryImage[]>(() => {
    return items.flatMap((item) => {
      const urls = Array.isArray(item.image_urls) ? item.image_urls : []
      return urls.map((url, index) => ({
        id: `${item.id}-${index}`,
        url,
        recordId: item.id,
        createdAt: item.created_at,
        prompt: item.prompt ?? "",
        model: item.model,
        generationMode: item.generation_mode,
        resolution: item.resolution,
        aspectRatio: item.aspect_ratio,
        outputFormat: item.output_format,
        creditsPerImage: item.credits_per_image ?? null,
      }))
    })
  }, [items])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => `${index + 1}`),
    [totalPages]
  )

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }
    const recordId = deleteTarget.recordId
    setDeletingId(recordId)
    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(recordId)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }
      setItems((prev) => prev.filter((item) => item.id !== recordId))
      toast({ title: t("historyDeleteSuccess") })
    } catch (err) {
      console.error("Failed to delete history item", err)
      toast({ title: t("historyDeleteError"), variant: "destructive" })
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const handleCopyPrompt = async () => {
    const text = selectedImage?.prompt?.trim() || ""
    if (!text) {
      toast({ title: t("historyPromptEmpty") })
      return
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setPromptCopied(true)
      toast({ title: t("historyPromptCopied") })
      window.setTimeout(() => setPromptCopied(false), 1500)
    } catch (err) {
      console.error("Prompt copy failed", err)
      toast({ title: t("historyPromptCopyError"), variant: "destructive" })
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-border/60 bg-sidebar/60 top-16 h-[calc(100svh-4rem)] group"
      >
        <SidebarHeader className="border-sidebar-border gap-4 border-b px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
            <SidebarLogoToggle />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("generateImage")}
                isActive={pathname === "/generator"}
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
                asChild
              >
                <Link href="/generator">
                  <Sparkles
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/generator" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("generateImage")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("historyNav")}
                isActive={pathname === "/history"}
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
                asChild
              >
                <Link href="/history">
                  <History
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/history" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("historyNav")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("billingNav")}
                isActive={pathname === "/billing"}
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
                asChild
              >
                <Link href="/billing">
                  <CreditCard
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/billing" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("billingNav")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 py-20">
            <div className="space-y-6">
              <Card className="border-border/60 bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("historySearch")}
                      className="h-11 pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-11 w-[150px] !h-11">
                        <SelectValue placeholder={t("historyTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("historyTypeAll")}</SelectItem>
                        <SelectItem value="image-to-image">{t("historyTypeImageEdit")}</SelectItem>
                        <SelectItem value="text-to-image">{t("historyTypeText")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-11 w-[150px] !h-11">
                        <SelectValue placeholder={t("historyDatePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("historyDateAll")}</SelectItem>
                        <SelectItem value="7">{t("historyDate7")}</SelectItem>
                        <SelectItem value="30">{t("historyDate30")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(viewMode === "grid" && "bg-muted")}
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(viewMode === "list" && "bg-muted")}
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {loading ? (
                <Card className="border-border/60 bg-background p-10 text-center text-sm text-muted-foreground">
                  {t("historyLoad")}
                </Card>
              ) : error ? (
                <Card className="border-border/60 bg-background p-10 text-center text-sm text-muted-foreground">
                  {error}
                </Card>
              ) : flattened.length === 0 ? (
                <Card className="border-border/60 bg-background p-8 shadow-sm">
                  <Empty className="border border-dashed border-border/60 bg-muted/40">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <History className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>{t("historyEmptyTitle")}</EmptyTitle>
                      <EmptyDescription>{t("historyEmptyDesc")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </Card>
              ) : viewMode === "list" ? (
                <div className="space-y-3">
                  {flattened.map((item) => {
                    const title = getPromptTitle(item.prompt, formatDate(item.createdAt))
                    const typeLabel = getDisplayGenerationLabel(item.generationMode)
                    return (
                      <Card key={item.id} className="border-border/60 bg-background p-4 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            className="h-24 w-full overflow-hidden rounded-lg border border-border/60 sm:h-20 sm:w-32"
                            onClick={() => setSelectedImage(item)}
                          >
                            <img src={item.url} alt={title} className="h-full w-full object-cover" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(item.createdAt)}
                              </span>
                              {item.model ? <span>{modelLabels[item.model] ?? item.model}</span> : null}
                              {item.resolution ? <span>{item.resolution.toUpperCase()}</span> : null}
                              {typeof item.creditsPerImage === "number" ? (
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {item.creditsPerImage} {t("creditsUnit")}
                                </span>
                              ) : null}
                              {typeLabel ? (
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {typeLabel}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => setSelectedImage(item)}
                            >
                              <Eye className="h-4 w-4" />
                              {t("historyView")}
                            </Button>
                            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <a href={item.url} download="nano-banana.png">
                                <Download className="h-4 w-4" />
                                {t("historyDownload")}
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => setDeleteTarget(item)}
                              disabled={deletingId === item.recordId}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("historyDelete")}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {flattened.map((item) => {
                    const title = getPromptTitle(item.prompt, formatDate(item.createdAt))
                    const typeLabel = getDisplayGenerationLabel(item.generationMode)
                    return (
                      <Card key={item.id} className="group overflow-hidden border-border/60 bg-background shadow-sm">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img src={item.url} alt={title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => setSelectedImage(item)}
                            >
                              <Eye className="h-4 w-4" />
                              {t("historyView")}
                            </Button>
                            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <a href={item.url} download="nano-banana.png">
                                <Download className="h-4 w-4" />
                                {t("historyDownload")}
                              </a>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => setDeleteTarget(item)}
                              disabled={deletingId === item.recordId}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("historyDelete")}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 p-4">
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(item.createdAt)}
                            </span>
                            {item.model ? <span>{modelLabels[item.model] ?? item.model}</span> : null}
                            {typeof item.creditsPerImage === "number" ? (
                              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {item.creditsPerImage} {t("creditsUnit")}
                              </span>
                            ) : null}
                            {typeLabel ? (
                              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {typeLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number.parseInt(value, 10))}>
                  <SelectTrigger className="h-9 w-[120px] !h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {t("historyPageSize")} {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{t("historyPrev")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">{t("historyNext")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null)
            setPromptOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generated Image</DialogTitle>
          </DialogHeader>
          {selectedImage ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                <img
                  src={selectedImage.url}
                  alt={getPromptTitle(selectedImage.prompt, formatDate(selectedImage.createdAt))}
                  className="w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {getPromptTitle(selectedImage.prompt, formatDate(selectedImage.createdAt))}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(selectedImage.createdAt)}</span>
                    {selectedImage.generationMode ? (
                      <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {getDisplayGenerationLabel(selectedImage.generationMode)}
                      </span>
                    ) : null}
                    {selectedImage.model ? (
                      <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {modelLabels[selectedImage.model] ?? selectedImage.model}
                      </span>
                    ) : null}
                    {typeof selectedImage.creditsPerImage === "number" ? (
                      <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {selectedImage.creditsPerImage} {t("creditsUnit")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <a href={selectedImage.url} download="nano-banana.png">
                      <Download className="h-4 w-4" />
                      {t("historyDownload")}
                    </a>
                  </Button>
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setPromptOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    {t("historyPromptFull")}
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setDeleteTarget(selectedImage)}
                    disabled={deletingId === selectedImage.recordId}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("historyDelete")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("historyPromptTitle")}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-foreground">
            {selectedImage?.prompt || t("historyPromptEmpty")}
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleCopyPrompt}
              disabled={promptCopied}
            >
              {promptCopied ? t("historyPromptCopied") : t("historyPromptCopy")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("historyDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("historyDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              {t("historyDeleteCancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={Boolean(deletingId)}>
              {t("historyDeleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
