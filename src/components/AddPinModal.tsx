import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Link2,
  Sparkles,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  Star,
  Check,
  Film,
  BookOpen,
  Tv,
  ListPlus,
  ListVideo,
  Plus,
  Trash2,
  Layers,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Pin, Platform, ContentType, Category, Status, Collection, PlaylistPart } from '../types'
import { detectPlatform, extractYouTubeId, uid, guessCategory, inferContentType } from '../utils'
import { extractPlaylistId, fetchYoutubePlaylist } from '../utils/youtubeApi'
import { fetchVideoMeta, youtubeHqThumb } from '../utils/metadata'
import { compressImageToWebp, saveBlob, getBlobUrl } from '../utils/db'
import { PlatformBadge } from './Badges'

export const getFallbackTitleFromUrl = (inputUrl: string): string => {
  if (!inputUrl) return 'Новый закреп'
  const trimmed = inputUrl.trim()
  const ytId = extractYouTubeId(trimmed)
  if (ytId) {
    return `YouTube (${ytId})`
  }
  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const u = new URL(normalized)
    const host = u.hostname.replace(/^www\./, '')
    const pathSeg = u.pathname.split('/').filter(Boolean).pop()
    if (pathSeg && pathSeg.length < 30) {
      return `${host} / ${decodeURIComponent(pathSeg)}`
    }
    return host || trimmed
  } catch {
    return trimmed || 'Новый закреп'
  }
}

type AddMode = 'single' | 'batch' | 'playlist'

interface AddPinModalProps {
  open: boolean
  onClose: () => void
  onAdd: (pin: Pin) => void
  onUpdate?: (pin: Pin) => void
  editingPin?: Pin | null
  onAddBatch?: (pins: Pin[]) => void
  onImportPlaylistAsCollection?: (collectionName: string, pins: Pin[]) => void
  initialUrl?: string
  collections: Collection[]
  onOpenAddCollection?: () => void
  activeCategory?: string
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Видео / Разбор', icon: <Film size={13} /> },
  { value: 'lecture', label: 'Лекция / Курс', icon: <BookOpen size={13} /> },
  { value: 'anime', label: 'Аниме', icon: <Tv size={13} /> },
  { value: 'series', label: 'Сериал', icon: <Tv size={13} /> },
  { value: 'movie', label: 'Фильм', icon: <Film size={13} /> },
]

const STATUSES: { value: Status; label: string }[] = [
  { value: 'watching', label: '▶ Смотрю' },
  { value: 'queued', label: 'В очереди' },
  { value: 'completed', label: 'Просмотрено' },
  { value: 'archived', label: 'В архив' },
]

interface PartDraft {
  id: string
  title: string
  url: string
  timecode?: string
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
  open,
  onClose,
  onAdd,
  onUpdate,
  editingPin,
  onAddBatch,
  onImportPlaylistAsCollection,
  initialUrl = '',
  collections,
  onOpenAddCollection,
  activeCategory,
}) => {
  const [mode, setMode] = useState<AddMode>('single')

  // Single Pin form state
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [channelName, setChannelName] = useState('')
  const [contentType, setContentType] = useState<ContentType>('video')
  const [category, setCategory] = useState<Category>('video')
  const [status, setStatus] = useState<Status>('watching')
  const [tagsInput, setTagsInput] = useState('')
  const [note, setNote] = useState('')

  // Episode / Lecture tracking
  const [currentEp, setCurrentEp] = useState('1')
  const [totalEp, setTotalEp] = useState('')
  const [dubStudio, setDubStudio] = useState('')
  const [rating, setRating] = useState<number | undefined>()
  const [lectureNum, setLectureNum] = useState('')
  const [totalLectures, setTotalLectures] = useState('')
  const [timecode, setTimecode] = useState('')

  // Cover image handling
  const [autoThumbUrl, setAutoThumbUrl] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [thumbDbKey, setThumbDbKey] = useState<string | undefined>()
  const [isCompressing, setIsCompressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Status & loading
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Batch Mode State
  const [batchUrlsText, setBatchUrlsText] = useState('')
  const [batchCategory, setBatchCategory] = useState<Category>('video')
  const [batchStatus, setBatchStatus] = useState<Status>('queued')

  // Playlist Mode State
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistCategory, setPlaylistCategory] = useState<Category>('anime')
  const [playlistParts, setPlaylistParts] = useState<PartDraft[]>([
    { id: uid(), title: 'Фильм 1', url: '' },
    { id: uid(), title: 'Фильм 2', url: '' },
  ])

  // Playlist Auto-Import State
  const [detectedPlaylistId, setDetectedPlaylistId] = useState<string | null>(null)
  const [playlistSaveMode, setPlaylistSaveMode] = useState<'card' | 'collection'>('card')
  const [isImportPlaylist, setIsImportPlaylist] = useState(false)
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false)
  const [playlistError, setPlaylistError] = useState<string | null>(null)
  const [importedParts, setImportedParts] = useState<PlaylistPart[]>([])
  const [showPlaylistPreview, setShowPlaylistPreview] = useState(false)
  const [fallbackLinksText, setFallbackLinksText] = useState('')
  const [showFallbackManualInput, setShowFallbackManualInput] = useState(false)

  const platform: Platform = url ? detectPlatform(url) : 'web'

  // Initialize or handle editingPin / initialUrl change
  useEffect(() => {
    if (open) {
      if (editingPin) {
        setMode('single')
        setUrl(editingPin.url)
        setTitle(editingPin.title)
        setChannelName(editingPin.channelName || '')
        setContentType(editingPin.contentType)
        setCategory(editingPin.category)
        setStatus(editingPin.status)
        setTimecode(editingPin.timecode || '')
        setCurrentEp(String(editingPin.currentEpisode ?? editingPin.currentEp ?? 1))
        setTotalEp(
          editingPin.totalEpisodes || editingPin.totalEp
            ? String(editingPin.totalEpisodes || editingPin.totalEp)
            : '',
        )
        setDubStudio(editingPin.dubStudio || '')
        setRating(editingPin.rating)
        setLectureNum(editingPin.lectureNumber ? String(editingPin.lectureNumber) : '')
        setTotalLectures(editingPin.totalLectures ? String(editingPin.totalLectures) : '')
        setTagsInput((editingPin.tags || []).join(', '))
        setNote(editingPin.note || editingPin.notes || '')
        setAutoThumbUrl(editingPin.thumbnailUrl || null)
        setCoverPreview(editingPin.customThumbnailUrl || null)
        setThumbDbKey(editingPin.thumbnailDbKey)
        if (editingPin.thumbnailDbKey) {
          getBlobUrl(editingPin.thumbnailDbKey).then((url) => {
            if (url) setCoverPreview(url)
          })
        }
        setUrlError('')
        if (editingPin.parts && editingPin.parts.length > 0) {
          setImportedParts(editingPin.parts)
          setIsImportPlaylist(true)
        } else {
          setImportedParts([])
          setIsImportPlaylist(false)
        }
      } else {
        const defaultCat =
          activeCategory && activeCategory !== 'all' ? activeCategory : collections[0]?.id || 'video'
        setCategory(defaultCat)
        setBatchCategory(defaultCat)
        setPlaylistCategory(defaultCat)
        setNote('')
        setDetectedPlaylistId(null)
        setIsImportPlaylist(false)
        setImportedParts([])

        if (initialUrl) {
          handleUrlInput(initialUrl)
        } else if (!url) {
          setContentType('video')
          setStatus('watching')
        }
      }
    } else {
      // Clear form when closed
      setUrl('')
      setTitle('')
      setChannelName('')
      setAutoThumbUrl(null)
      setCoverPreview(null)
      setThumbDbKey(undefined)
      setUrlError('')
      setTagsInput('')
      setDubStudio('')
      setRating(undefined)
      setTimecode('')
      setNote('')
      setBatchUrlsText('')
      setPlaylistTitle('')
      setPlaylistParts([
        { id: uid(), title: 'Часть 1', url: '' },
        { id: uid(), title: 'Часть 2', url: '' },
      ])
      setDetectedPlaylistId(null)
      setIsImportPlaylist(false)
      setIsLoadingPlaylist(false)
      setPlaylistError(null)
      setImportedParts([])
      setShowPlaylistPreview(false)
      setFallbackLinksText('')
      setShowFallbackManualInput(false)
    }
  }, [open, initialUrl, editingPin, activeCategory, collections])

  // Load playlist videos from RSS feed via CORS proxies & metadata
  const handleLoadPlaylist = async (playlistId: string) => {
    setIsLoadingPlaylist(true)
    setPlaylistError(null)

    try {
      const res = await fetchYoutubePlaylist(playlistId)
      setIsLoadingPlaylist(false)

      if (res.title && (!title || title === getFallbackTitleFromUrl(url))) {
        setTitle(res.title)
      }
      if (res.author && !channelName) {
        setChannelName(res.author)
      }
      if (res.thumbnail && !autoThumbUrl && !coverPreview) {
        setAutoThumbUrl(res.thumbnail)
      }

      if (res.videos.length > 0) {
        const parts: PlaylistPart[] = res.videos.map((v, i) => ({
          id: uid(),
          title: v.title || `Видео #${i + 1}`,
          url: v.url,
          isCompleted: false,
        }))
        setImportedParts(parts)
        setIsImportPlaylist(true)
      } else {
        setPlaylistError(
          res.error ||
            'Прокси временно не ответил. Плейлист всё равно можно сохранить в 1 клик.',
        )
      }
    } catch {
      setIsLoadingPlaylist(false)
      setPlaylistError(
        'Прокси временно не ответил. Плейлист всё равно можно сохранить в 1 клик.',
      )
    }
  }


  const handleApplyManualLinks = () => {
    const lines = fallbackLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) return
    const parts: PlaylistPart[] = lines.map((link, idx) => {
      const ytId = extractYouTubeId(link)
      return {
        id: uid(),
        title: ytId ? `Видео #${idx + 1}` : `Часть ${idx + 1}`,
        url: link,
        isCompleted: false,
      }
    })
    setImportedParts(parts)
    setIsImportPlaylist(true)
    setPlaylistError(null)
    setShowFallbackManualInput(false)
    setShowPlaylistPreview(true)
  }

  // Handle URL change with auto-detection & metadata fetch
  const handleUrlInput = async (val: string) => {
    const trimmed = val.trim()
    setUrl(trimmed)
    setUrlError('')

    if (!trimmed) {
      setAutoThumbUrl(null)
      setDetectedPlaylistId(null)
      return
    }

    // Check for YouTube playlist parameter (list=...)
    const pId = extractPlaylistId(trimmed)
    if (pId) {
      setDetectedPlaylistId(pId)
      setIsImportPlaylist(true)
      void handleLoadPlaylist(pId)
    } else {
      setDetectedPlaylistId(null)
    }

    const detectedPlat = detectPlatform(trimmed)
    const inferredCt = inferContentType(detectedPlat)
    setContentType(inferredCt)

    // Only set category if currently at default
    const guessed = guessCategory(trimmed, inferredCt)
    if (collections.some((c) => c.id === guessed)) {
      setCategory(guessed)
    }

    // 1. YouTube instant high-res thumbnail
    const ytId = extractYouTubeId(trimmed)
    if (ytId) {
      setAutoThumbUrl(youtubeHqThumb(ytId))
    }

    // 2. Fetch metadata via oembed
    if (/^https?:\/\//i.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed)) {
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      setIsLoadingMeta(true)
      try {
        const meta = await fetchVideoMeta(normalized)
        const fallback = getFallbackTitleFromUrl(trimmed)
        if (meta.title && (!title || title === fallback)) setTitle(meta.title)
        if (meta.author && !channelName) setChannelName(meta.author)
        if (meta.thumbnailUrl && !ytId && !coverPreview) {
          setAutoThumbUrl(meta.thumbnailUrl)
        }
      } catch {
        // graceful fallback - never block!
      } finally {
        setIsLoadingMeta(false)
      }
    }
  }

  // Handle image compression and IndexedDB saving
  const handleProcessImage = async (file: Blob) => {
    setIsCompressing(true)
    try {
      const compressed = await compressImageToWebp(file, 900)
      const key = `poster_${uid()}`
      await saveBlob(key, compressed)
      setThumbDbKey(key)
      setCoverPreview(URL.createObjectURL(compressed))
    } catch {
      alert('Не удалось обработать изображение')
    } finally {
      setIsCompressing(false)
    }
  }

  // File Drop / Select
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleProcessImage(file)
    }
  }

  // Paste handling for images or URLs
  const handleModalPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleProcessImage(file)
          return
        }
      }
    }

    // If paste is text and url is empty in single mode, auto-paste into URL
    if (mode === 'single') {
      const text = e.clipboardData.getData('text')
      if (text && !url && /^https?:\/\//i.test(text.trim())) {
        handleUrlInput(text.trim())
      }
    }
  }

  const isEpisodic = contentType === 'anime' || contentType === 'series'
  const isLecture = contentType === 'lecture'

  // Submit Single Pin
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    const finalParts: PlaylistPart[] | undefined =
      isImportPlaylist && importedParts.length > 0
        ? importedParts
        : editingPin?.parts

    const effectiveUrl = trimmedUrl || (finalParts && finalParts[0]?.url) || ''
    if (!effectiveUrl) {
      setUrlError('Вставьте ссылку на медиа')
      return
    }

    // Instant and unconditional title: fallback to URL domain/link if user didn't type title
    const finalTitle = title.trim() || getFallbackTitleFromUrl(effectiveUrl)

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))

    const epCur = isEpisodic && currentEp ? parseInt(currentEp) : undefined
    const epTot = isEpisodic && totalEp ? parseInt(totalEp) : undefined
    const lectNum = isLecture && lectureNum ? parseInt(lectureNum) : undefined
    const lectTot = isLecture && totalLectures ? parseInt(totalLectures) : undefined

    const now = new Date().toISOString()

    // ── Mode B: Import playlist as a new collection / tab ──
    if (detectedPlaylistId && playlistSaveMode === 'collection' && onImportPlaylistAsCollection) {
      const playlistName = finalTitle || 'Плейлист YouTube'
      const generatedPins: Pin[] =
        importedParts.length > 0
          ? importedParts.map((p, idx) => {
              const ytId = extractYouTubeId(p.url)
              return {
                id: uid(),
                title: p.title.trim() || `Видео #${idx + 1}`,
                url: p.url,
                platform: 'youtube' as Platform,
                contentType: 'video' as ContentType,
                category: '',
                status: 'watching' as Status,
                thumbnailUrl: ytId ? youtubeHqThumb(ytId) : autoThumbUrl || undefined,
                channelName: channelName.trim() || undefined,
                isPinned: idx === 0,
                createdAt: now,
                updatedAt: now,
              }
            })
          : [
              {
                id: uid(),
                title: playlistName,
                url: effectiveUrl,
                platform: 'youtube' as Platform,
                contentType: 'series' as ContentType,
                category: '',
                status: 'watching' as Status,
                thumbnailUrl: autoThumbUrl || undefined,
                channelName: channelName.trim() || undefined,
                isPinned: true,
                createdAt: now,
                updatedAt: now,
              },
            ]

      onImportPlaylistAsCollection(playlistName, generatedPins)
      onClose()
      return
    }

    const finalContentType: ContentType =
      finalParts && finalParts.length > 0
        ? contentType === 'lecture'
          ? 'lecture'
          : 'series'
        : contentType

    const calculatedTotalEp = finalParts && finalParts.length > 0 ? finalParts.length : epTot

    const targetPin: Pin = {
      id: editingPin ? editingPin.id : uid(),
      title: finalTitle,
      url: effectiveUrl,
      platform,
      contentType: finalContentType,
      category,
      status,
      thumbnailUrl: autoThumbUrl || undefined,
      customThumbnailUrl: coverPreview || undefined,
      thumbnailDbKey: thumbDbKey,
      timecode: timecode.trim() || undefined,
      currentEp: epCur || (finalParts ? 1 : undefined),
      totalEp: calculatedTotalEp,
      currentEpisode: epCur || (finalParts ? 1 : undefined),
      totalEpisodes: calculatedTotalEp,
      parts: finalParts,
      dubStudio: isEpisodic && dubStudio ? dubStudio.trim() : undefined,
      rating: isEpisodic ? rating : undefined,
      lectureNumber: lectNum,
      totalLectures: lectTot,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      note: note.trim() || undefined,
      notes: note.trim() || undefined,
      channelName: channelName.trim() || undefined,
      isPinned: editingPin ? editingPin.isPinned : status === 'watching',
      createdAt: editingPin ? editingPin.createdAt : now,
      updatedAt: now,
    }

    if (editingPin && onUpdate) {
      onUpdate(targetPin)
    } else {
      onAdd(targetPin)
    }
    onClose()
  }

  // Submit Batch Links
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lines = batchUrlsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) {
      alert('Вставьте хотя бы одну ссылку в поле ввода')
      return
    }

    const now = new Date().toISOString()
    const generatedPins: Pin[] = lines.map((link) => {
      const plat = detectPlatform(link)
      const ytId = extractYouTubeId(link)
      let parsedTitle = link
      try {
        const u = new URL(link)
        parsedTitle = u.pathname.split('/').filter(Boolean).pop() || u.hostname
      } catch {
        // fallback
      }
      if (ytId) {
        parsedTitle = `YouTube • ${ytId}`
      }

      return {
        id: uid(),
        title: parsedTitle,
        url: link,
        platform: plat,
        contentType: 'video',
        category: batchCategory,
        status: batchStatus,
        thumbnailUrl: ytId ? youtubeHqThumb(ytId) : undefined,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      }
    })

    if (onAddBatch) {
      onAddBatch(generatedPins)
    } else {
      generatedPins.forEach((p) => onAdd(p))
    }
    onClose()
  }

  // Submit Playlist / Multi-part Collection
  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validParts = playlistParts.filter((p) => p.url.trim().length > 0)
    if (validParts.length === 0) {
      alert('Добавьте хотя бы одну часть со ссылкой')
      return
    }

    const now = new Date().toISOString()
    const firstUrl = validParts[0].url.trim()
    const finalPlaylistTitle =
      playlistTitle.trim() || getFallbackTitleFromUrl(firstUrl) || 'Новый плейлист'
    const plat = detectPlatform(firstUrl)
    const ytId = extractYouTubeId(firstUrl)

    const finalParts: PlaylistPart[] = validParts.map((p, idx) => ({
      id: p.id || uid(),
      title: p.title.trim() || `Часть ${idx + 1}`,
      url: p.url.trim(),
      isCompleted: false,
      timecode: p.timecode?.trim() || undefined,
    }))

    const newPin: Pin = {
      id: uid(),
      title: finalPlaylistTitle,
      url: firstUrl,
      platform: plat,
      contentType: 'series',
      category: playlistCategory,
      status: 'watching',
      parts: finalParts,
      thumbnailUrl: ytId ? youtubeHqThumb(ytId) : undefined,
      customThumbnailUrl: coverPreview || undefined,
      thumbnailDbKey: thumbDbKey,
      isPinned: true,
      createdAt: now,
      updatedAt: now,
    }

    onAdd(newPin)
    onClose()
  }

  const addPlaylistPart = () => {
    setPlaylistParts((prev) => [
      ...prev,
      { id: uid(), title: `Часть ${prev.length + 1}`, url: '' },
    ])
  }

  const removePlaylistPart = (id: string) => {
    setPlaylistParts((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePlaylistPart = (id: string, field: 'title' | 'url' | 'timecode', val: string) => {
    setPlaylistParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)),
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="add-pin-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
          onPaste={handleModalPaste}
        >
          <motion.div
            key="add-pin-modal"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-modal w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden border border-white/10 max-h-[92vh] flex flex-col shadow-2xl bg-[#0b0d13]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Mode Switcher */}
            <div className="p-4 px-6 border-b border-white/[0.08] shrink-0 space-y-3 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl btn-gold text-[#f3e5ab]">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      {editingPin ? 'Редактировать закреп' : 'Добавить в коллекцию'}
                      {isLoadingMeta && (
                        <span className="flex items-center gap-1 text-[11px] text-[#f3e5ab] font-normal">
                          <Sparkles size={12} className="animate-spin text-[#ff2a85]" />
                          Автопарсинг...
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/40">
                      {editingPin
                        ? 'Измените название, ссылку, раздел, обложку, таймкод или заметку'
                        : 'Вставьте ссылку, список или создайте многосерийный закреп'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Switcher Tabs (Only when creating new, not when editing) */}
              {!editingPin && (
                <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === 'single'
                        ? 'btn-gold text-[#f3e5ab] shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Одиночный закреп</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('batch')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === 'batch'
                        ? 'btn-rose text-[#ff2a85] shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <ListPlus size={13} />
                    <span>Быстрый список</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('playlist')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === 'playlist'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30 shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <ListVideo size={13} />
                    <span>Плейлист / Части</span>
                  </button>
                </div>
              )}
            </div>

            {/* ───── MODE 1: SINGLE PIN FORM ───── */}
            {mode === 'single' && (
              <form onSubmit={handleSingleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* URL Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Ссылка на медиа *
                    </label>
                    {url && <PlatformBadge platform={platform} />}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... или любая ссылка"
                      className={`w-full bg-white/[0.03] border rounded-xl px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/20 transition-all ${
                        urlError ? 'border-red-500/50' : 'border-white/10 focus:border-[#f3e5ab]'
                      }`}
                      autoFocus
                    />
                  </div>
                  {urlError && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <AlertCircle size={12} /> {urlError}
                    </div>
                  )}

                  {/* ── YouTube Playlist detected banner ── */}
                  {detectedPlaylistId && (
                    <div className="mt-2.5 p-3.5 rounded-2xl bg-[rgba(255,42,133,0.03)] border border-[#ff2a85]/30 space-y-3 shadow-[0_0_20px_rgba(255,42,133,0.06)]">
                      {/* Top info row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg btn-rose text-[#ff2a85]">
                            <ListVideo size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              Обнаружен плейлист YouTube
                              {isLoadingPlaylist && (
                                <Loader2 size={12} className="animate-spin text-[#f3e5ab]" />
                              )}
                            </span>
                            <span className="text-[10px] mono text-white/40">
                              list={detectedPlaylistId.slice(0, 16)}...
                            </span>
                          </div>
                        </div>

                        {importedParts.length > 0 && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                            <Check size={12} /> Найдено видео: {importedParts.length}
                          </span>
                        )}
                      </div>

                      {/* 2-Mode Selector (Режим А vs Режим Б) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/40 block uppercase tracking-wider mono">
                          Режим сохранения плейлиста в 1 клик:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Mode A: Card Playlist */}
                          <button
                            type="button"
                            onClick={() => setPlaylistSaveMode('card')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                              playlistSaveMode === 'card'
                                ? 'bg-[#f3e5ab]/10 border-[#f3e5ab] text-white shadow-[0_0_12px_rgba(243,229,171,0.15)] ring-1 ring-[#f3e5ab]/40'
                                : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#f3e5ab] flex items-center gap-1.5">
                                🗂 Карточка-плейлист
                              </span>
                              {playlistSaveMode === 'card' && (
                                <span className="text-[9px] mono px-1.5 py-0.2 rounded-full bg-[#f3e5ab]/20 text-[#f3e5ab] font-bold">
                                  По умолчанию
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                              1 карточка со счётчиком ({importedParts.length > 0 ? `1/${importedParts.length}` : 'список роликов'}), прогресс-баром и переключением
                            </p>
                          </button>

                          {/* Mode B: New Section / Collection */}
                          <button
                            type="button"
                            onClick={() => setPlaylistSaveMode('collection')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                              playlistSaveMode === 'collection'
                                ? 'bg-[#ff2a85]/10 border-[#ff2a85] text-white shadow-[0_0_12px_rgba(255,42,133,0.18)] ring-1 ring-[#ff2a85]/40'
                                : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#ff2a85] flex items-center gap-1.5">
                                📑 Новый раздел (вкладка)
                              </span>
                              {playlistSaveMode === 'collection' && (
                                <span className="text-[9px] mono px-1.5 py-0.2 rounded-full bg-[#ff2a85]/20 text-[#ff2a85] font-bold">
                                  Выбрано
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                              Создаст вкладку «{title || (url ? getFallbackTitleFromUrl(url) : 'Плейлист')}» и добавит все видео отдельными карточками
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Loading State or Track-list Toggle */}
                      {isLoadingPlaylist ? (
                        <div className="flex items-center gap-2 text-xs text-white/70 py-1">
                          <Loader2 size={13} className="animate-spin text-[#f3e5ab]" />
                          <span>Загружаем список видео через RSS YouTube...</span>
                        </div>
                      ) : importedParts.length > 0 ? (
                        <div className="space-y-1.5 pt-1 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60 text-[11px]">
                              {playlistSaveMode === 'card'
                                ? `В карточку будет добавлено ${importedParts.length} видео с интерактивным переключением`
                                : `В новый раздел будет добавлено ${importedParts.length} карточек`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPlaylistPreview(!showPlaylistPreview)}
                              className="text-[11px] text-[#f3e5ab] hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <span>{showPlaylistPreview ? 'Свернуть трек-лист' : 'Показать трек-лист'}</span>
                              {showPlaylistPreview ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>

                          {showPlaylistPreview && (
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-black/40 p-2 rounded-xl border border-white/10">
                              {importedParts.map((p, idx) => (
                                <div
                                  key={p.id}
                                  className="text-xs text-white/80 truncate flex items-center gap-2 py-0.5"
                                >
                                  <span className="mono text-[10px] text-[#f3e5ab] font-bold">
                                    #{idx + 1}
                                  </span>
                                  <span className="truncate">{p.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Manual links input / fallback (Always accessible, never blocking) */}
                      <div className="pt-1 border-t border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowFallbackManualInput(!showFallbackManualInput)}
                            className="text-[11px] text-[#f3e5ab]/80 hover:text-[#f3e5ab] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={11} />
                            <span>Вставить ссылки списком вручную</span>
                            {showFallbackManualInput ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>

                          {playlistError && (
                            <button
                              type="button"
                              onClick={() => handleLoadPlaylist(detectedPlaylistId)}
                              className="text-[10px] text-white/50 hover:text-white underline cursor-pointer"
                            >
                              Повторить RSS
                            </button>
                          )}
                        </div>

                        {showFallbackManualInput && (
                          <div className="space-y-2 pt-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <textarea
                              value={fallbackLinksText}
                              onChange={(e) => setFallbackLinksText(e.target.value)}
                              placeholder="Вставьте ссылки на ролики по одной на строку:&#10;https://youtube.com/watch?v=...&#10;https://youtube.com/watch?v=..."
                              rows={3}
                              className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-xs text-white/90 placeholder:text-white/25 focus:border-[#f3e5ab] font-mono leading-relaxed"
                            />
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={handleApplyManualLinks}
                                className="px-3 py-1 rounded-lg btn-gold text-xs font-semibold cursor-pointer shadow-md"
                              >
                                Сформировать видео ({fallbackLinksText.split('\n').filter((l) => l.trim().length > 0).length})
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Title & Channel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Название
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={url ? `Название (по умолчанию: ${getFallbackTitleFromUrl(url)})` : 'Название видео, лекции или тайтла'}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:border-[#f3e5ab] transition-all"
                    />
                  </div>
                  <div>
                    <label
                      className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Канал / Автор
                    </label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Имя автора"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:border-[#f3e5ab] transition-all"
                    />
                  </div>
                </div>

                {/* Poster Dropzone (Drag-and-Drop + Ctrl+V + WebP compression) */}
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 flex items-center justify-between uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>Обложка / Постер (WebP в IndexedDB)</span>
                    <span className="text-[#f3e5ab]/80 flex items-center gap-1">
                      <ImageIcon size={11} /> Вставь картинку через Ctrl+V
                    </span>
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative p-3 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center gap-3 ${
                      isDragging
                        ? 'border-[#ff2a85] bg-[#ff2a85]/5'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                  >
                    {/* Thumbnail Preview if present */}
                    {coverPreview || autoThumbUrl ? (
                      <div className="relative w-36 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black">
                        <img
                          src={coverPreview || autoThumbUrl || ''}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverPreview(null)
                            setAutoThumbUrl(null)
                            setThumbDbKey(undefined)
                          }}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white/70 hover:text-white cursor-pointer"
                          title="Удалить обложку"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/30 shrink-0">
                        <ImageIcon size={22} />
                      </div>
                    )}

                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs text-white/80 font-medium">
                        {isCompressing
                          ? 'Сжатие постера в WebP...'
                          : coverPreview
                          ? 'Кастомная обложка сжата и сохранена'
                          : autoThumbUrl
                          ? 'Обложка подтянута автоматически из видео'
                          : 'Перетащите постер сюда или нажмите для выбора'}
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        Автоматическое сжатие до 900px в легкий WebP без потери качества
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl btn-gold text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={12} /> Выбрать файл
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleProcessImage(f)
                      }}
                    />
                  </div>
                </div>

                {/* Content Type & Category Selector */}
                <div className="space-y-4 pt-1">
                  {/* Category / Section Selection with inline "+ Новый раздел" */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="text-[10px] text-white/40 uppercase tracking-wider"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Раздел / Коллекция
                      </label>
                      {onOpenAddCollection && (
                        <button
                          type="button"
                          onClick={onOpenAddCollection}
                          className="text-[11px] text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Plus size={12} />
                          <span>+ Создать раздел</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {collections.map((cat) => {
                        const active = category === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              active
                                ? 'btn-rose text-[#ff2a85] font-semibold'
                                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {cat.emoji && <span>{cat.emoji}</span>}
                            <span>{cat.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Content Type */}
                  <div>
                    <label
                      className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Тип контента
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONTENT_TYPES.map((ct) => {
                        const active = contentType === ct.value
                        return (
                          <button
                            key={ct.value}
                            type="button"
                            onClick={() => {
                              setContentType(ct.value)
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              active
                                ? 'btn-gold text-[#f3e5ab] font-semibold'
                                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {ct.icon}
                            <span>{ct.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Episodic / Lecture Trackers */}
                {isEpisodic ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Серия
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentEp}
                        onChange={(e) => setCurrentEp(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-sm font-semibold text-white mono"
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Всего серий
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalEp}
                        onChange={(e) => setTotalEp(e.target.value)}
                        placeholder="25"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-sm font-semibold text-white mono"
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Студия / Озвучка
                      </label>
                      <input
                        type="text"
                        value={dubStudio}
                        onChange={(e) => setDubStudio(e.target.value)}
                        placeholder="AniDUB / Дубляж"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Оценка (1-10)
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(rating === star ? undefined : star)}
                            className="p-0.5 text-white/20 hover:text-[#f3e5ab]"
                            style={{
                              color: rating && rating >= star ? '#f3e5ab' : undefined,
                            }}
                          >
                            <Star
                              size={12}
                              fill={rating && rating >= star ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isLecture ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Лекция №
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={lectureNum}
                        onChange={(e) => setLectureNum(e.target.value)}
                        placeholder="1"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-sm font-semibold text-white mono"
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Всего в курсе
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalLectures}
                        onChange={(e) => setTotalLectures(e.target.value)}
                        placeholder="48"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-sm font-semibold text-white mono"
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] text-white/40 mb-1 block"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Таймкод остановки
                      </label>
                      <input
                        type="text"
                        value={timecode}
                        onChange={(e) => setTimecode(e.target.value)}
                        placeholder="01:24:15"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f3e5ab] mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className="text-[10px] text-white/40 mb-1 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Таймкод остановки
                    </label>
                    <input
                      type="text"
                      value={timecode}
                      onChange={(e) => setTimecode(e.target.value)}
                      placeholder="00:45:10 или 12:30"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f3e5ab] mono"
                    />
                  </div>
                )}

                {/* Tags & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Теги (через запятую)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="#фильмы, #лекции, #топ"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-[#f3e5ab]"
                    />
                  </div>

                  <div>
                    <label
                      className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Статус
                    </label>
                    <div className="flex gap-1">
                      {STATUSES.map((st) => {
                        const active = status === st.value
                        return (
                          <button
                            key={st.value}
                            type="button"
                            onClick={() => setStatus(st.value)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              active
                                ? 'btn-gold font-semibold text-[#f3e5ab]'
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {st.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Note / Заметка */}
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Заметка к закреплению
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Короткий комментарий, напоминание или совет к просмотру..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-[#f3e5ab] transition-all resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all ${
                      detectedPlaylistId
                        ? playlistSaveMode === 'collection'
                          ? 'btn-rose text-white shadow-[0_0_16px_rgba(255,42,133,0.35)]'
                          : 'btn-gold text-[#f3e5ab] shadow-[0_0_16px_rgba(243,229,171,0.25)]'
                        : 'btn-gold text-[#f3e5ab]'
                    }`}
                  >
                    <Check size={14} />{' '}
                    {editingPin
                      ? 'Сохранить изменения'
                      : detectedPlaylistId
                      ? playlistSaveMode === 'collection'
                        ? `Создать раздел и импортировать (${importedParts.length || 1})`
                        : `Сохранить как плейлист (${importedParts.length || 1})`
                      : 'Создать закреп'}
                  </button>
                </div>
              </form>
            )}

            {/* ───── MODE 2: BATCH LIST (Быстрый список ссылок) ───── */}
            {mode === 'batch' && (
              <form onSubmit={handleBatchSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Ссылки (по одной на строке) *
                  </label>
                  <textarea
                    rows={8}
                    value={batchUrlsText}
                    onChange={(e) => setBatchUrlsText(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/watch?v=...&#10;https://rutube.ru/video/..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-white/20 focus:border-[#ff2a85] font-mono leading-relaxed resize-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-white/40 mt-1">
                    Строки будут автоматически преобразованы в отдельные закрепы с подгруженными превью.
                  </p>
                </div>

                {/* Batch Category selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Поместить в раздел
                    </label>
                    {onOpenAddCollection && (
                      <button
                        type="button"
                        onClick={onOpenAddCollection}
                        className="text-[11px] text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus size={12} />
                        <span>+ Создать раздел</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {collections.map((cat) => {
                      const active = batchCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setBatchCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'btn-rose text-[#ff2a85] font-semibold'
                              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {cat.emoji && <span>{cat.emoji}</span>}
                          <span>{cat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Batch Status */}
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Начальный статус
                  </label>
                  <div className="flex gap-1">
                    {STATUSES.map((st) => {
                      const active = batchStatus === st.value
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setBatchStatus(st.value)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'btn-gold font-semibold text-[#f3e5ab]'
                              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {st.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-white/40 mono">
                    Найдено ссылок:{' '}
                    {batchUrlsText.split('\n').filter((l) => l.trim().length > 0).length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl btn-rose text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Check size={14} /> Создать пачкой
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ───── MODE 3: PLAYLIST / MULTI-PART (Коллекция частей) ───── */}
            {mode === 'playlist' && (
              <form onSubmit={handlePlaylistSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Title */}
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Общее название плейлиста / тайтла *
                  </label>
                  <input
                    type="text"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    placeholder="Например: Сага «Сумерки» (Все фильмы)"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-purple-400"
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Раздел
                    </label>
                    {onOpenAddCollection && (
                      <button
                        type="button"
                        onClick={onOpenAddCollection}
                        className="text-[11px] text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus size={12} />
                        <span>+ Создать раздел</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {collections.map((cat) => {
                      const active = playlistCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setPlaylistCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'bg-purple-600/30 text-purple-300 border-purple-500/40 font-semibold'
                              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {cat.emoji && <span>{cat.emoji}</span>}
                          <span>{cat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Parts List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Части / Фильмы / Серии ({playlistParts.length})
                    </label>
                    <button
                      type="button"
                      onClick={addPlaylistPart}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Plus size={12} /> Добавить часть
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {playlistParts.map((part, index) => (
                      <div
                        key={part.id}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <span className="text-xs text-white/30 mono w-5 text-center shrink-0">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={part.title}
                          onChange={(e) => updatePlaylistPart(part.id, 'title', e.target.value)}
                          placeholder="Название части (напр. Новолуние)"
                          className="w-1/3 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={part.url}
                          onChange={(e) => updatePlaylistPart(part.id, 'url', e.target.value)}
                          placeholder="Ссылка (YouTube, Rutube, VK...)"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/90"
                        />
                        {playlistParts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlaylistPart(part.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer shrink-0"
                            title="Удалить часть"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Check size={14} /> Создать плейлист
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
