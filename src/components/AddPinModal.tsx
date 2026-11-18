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
} from 'lucide-react'
import type { Pin, Platform, ContentType, Category, HistoryPeriod, Status } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { detectPlatform, extractYouTubeId, uid, guessCategory, inferContentType } from '../utils'
import { fetchVideoMeta, youtubeHqThumb } from '../utils/metadata'
import { compressImageToWebp, saveBlob } from '../utils/db'
import { PlatformBadge } from './Badges'

interface AddPinModalProps {
  open: boolean
  onClose: () => void
  onAdd: (pin: Pin) => void
  initialUrl?: string
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Видео / Разбор', icon: <Film size={13} /> },
  { value: 'lecture', label: 'Лекция / Курс', icon: <BookOpen size={13} /> },
  { value: 'anime', label: 'Аниме', icon: <Tv size={13} /> },
  { value: 'series', label: 'Сериал', icon: <Tv size={13} /> },
  { value: 'movie', label: 'Фильм', icon: <Film size={13} /> },
]

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'video', label: 'Видео / Эссе' },
  { value: 'history', label: 'История (ЕГЭ / Олимп)' },
  { value: 'anime', label: 'Аниме и Кино' },
]

const STATUSES: { value: Status; label: string }[] = [
  { value: 'watching', label: '▶ Смотрю' },
  { value: 'queued', label: 'В очереди' },
  { value: 'completed', label: 'Просмотрено' },
  { value: 'archived', label: 'В архив' },
]

export const AddPinModal: React.FC<AddPinModalProps> = ({
  open,
  onClose,
  onAdd,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [channelName, setChannelName] = useState('')
  const [contentType, setContentType] = useState<ContentType>('video')
  const [category, setCategory] = useState<Category>('video')
  const [status, setStatus] = useState<Status>('watching')
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod | undefined>()
  const [tagsInput, setTagsInput] = useState('')

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

  const platform: Platform = url ? detectPlatform(url) : 'web'

  // Initialize or handle initialUrl change
  useEffect(() => {
    if (open) {
      if (initialUrl) {
        handleUrlInput(initialUrl)
      } else if (!url) {
        // Reset defaults
        setContentType('video')
        setCategory('video')
        setStatus('watching')
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
    }
  }, [open, initialUrl])

  // Handle URL change with auto-detection & metadata fetch
  const handleUrlInput = async (val: string) => {
    const trimmed = val.trim()
    setUrl(trimmed)
    setUrlError('')

    if (!trimmed) {
      setAutoThumbUrl(null)
      return
    }

    const detectedPlat = detectPlatform(trimmed)
    const inferredCt = inferContentType(detectedPlat)
    setContentType(inferredCt)
    setCategory(guessCategory(trimmed, inferredCt))

    // 1. YouTube instant high-res thumbnail
    const ytId = extractYouTubeId(trimmed)
    if (ytId) {
      setAutoThumbUrl(youtubeHqThumb(ytId))
    }

    // 2. Fetch metadata via oembed
    if (/^https?:\/\//i.test(trimmed)) {
      setIsLoadingMeta(true)
      try {
        const meta = await fetchVideoMeta(trimmed)
        if (meta.title && !title) setTitle(meta.title)
        if (meta.author && !channelName) setChannelName(meta.author)
        if (meta.thumbnailUrl && !ytId && !coverPreview) {
          setAutoThumbUrl(meta.thumbnailUrl)
        }
      } catch {
        // graceful fallback
      } finally {
        setIsLoadingMeta(false)
      }
    }
  }

  // Handle image compression and IndexedDB saving
  const handleProcessImage = async (file: Blob) => {
    setIsCompressing(true)
    try {
      // Compress to WebP ≤900px wide, quality 0.82
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

    // If paste is text and url is empty, auto-paste into URL
    const text = e.clipboardData.getData('text')
    if (text && !url && /^https?:\/\//i.test(text.trim())) {
      handleUrlInput(text.trim())
    }
  }

  const isEpisodic = contentType === 'anime' || contentType === 'series'
  const isLecture = contentType === 'lecture' || category === 'history'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setUrlError('Вставьте ссылку на медиа')
      return
    }
    if (!title.trim()) {
      setUrlError('Укажите название закрепа')
      return
    }

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
    const newPin: Pin = {
      id: uid(),
      title: title.trim(),
      url: url.trim(),
      platform,
      contentType,
      category,
      status,
      thumbnailUrl: autoThumbUrl || undefined,
      customThumbnailUrl: coverPreview || undefined,
      thumbnailDbKey: thumbDbKey,
      timecode: timecode.trim() || undefined,
      currentEp: epCur,
      totalEp: epTot,
      currentEpisode: epCur,
      totalEpisodes: epTot,
      dubStudio: isEpisodic && dubStudio ? dubStudio.trim() : undefined,
      rating: isEpisodic ? rating : undefined,
      lectureNumber: lectNum,
      totalLectures: lectTot,
      historyPeriod: category === 'history' ? historyPeriod : undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      channelName: channelName.trim() || undefined,
      isPinned: status === 'watching',
      createdAt: now,
      updatedAt: now,
    }

    onAdd(newPin)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="add-pin-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          onPaste={handleModalPaste}
        >
          <motion.div
            key="add-pin-modal"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-modal w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden border border-white/10 max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl btn-gold">
                  <Link2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    Создать закреп
                    {isLoadingMeta && (
                      <span className="flex items-center gap-1 text-[11px] text-[#f3e5ab] font-normal">
                        <Sparkles size={12} className="animate-spin text-[#ff2a85]" />
                        Автопарсинг...
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/40">
                    Вставьте ссылку или картинку через Ctrl+V
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

            {/* Form Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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
              </div>

              {/* Title & Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Название *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Название видео, лекции или тайтла"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:border-[#f3e5ab] transition-all"
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
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white/70 hover:text-white"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                            setCategory(guessCategory(url, ct.value))
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

                {/* Category */}
                <div>
                  <label
                    className="text-[10px] text-white/40 mb-1.5 block uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Раздел
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const active = category === cat.value
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'btn-rose text-[#ff2a85] font-semibold'
                              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* History Sub-period selector (when category is 'history') */}
              {category === 'history' && (
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <label
                    className="text-[10px] text-[#f3e5ab] uppercase tracking-wider block"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Подпериод истории (ЕГЭ / Олимп):
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-none">
                    {(Object.keys(HISTORY_PERIOD_LABELS) as HistoryPeriod[]).map((periodKey) => {
                      const active = historyPeriod === periodKey
                      return (
                        <button
                          key={periodKey}
                          type="button"
                          onClick={() =>
                            setHistoryPeriod(active ? undefined : periodKey)
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'bg-[rgba(243,229,171,0.15)] text-[#f3e5ab] border-[rgba(243,229,171,0.3)] shadow-sm'
                              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {HISTORY_PERIOD_LABELS[periodKey]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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
                    placeholder="#олимп, #лекция, #егэ"
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
            </form>

            {/* Footer Buttons */}
            <div className="p-4 px-6 border-t border-white/[0.08] flex items-center justify-end gap-3 shrink-0 bg-white/[0.01]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Check size={14} /> Создать закреп
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
