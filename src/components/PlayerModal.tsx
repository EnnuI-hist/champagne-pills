import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  Plus,
  Trash2,
  Clock,
  Tv,
  Star,
  FileText,
  Sparkles,
  ListVideo,
  CheckSquare,
  Square,
  Timer,
  Play,
  Eye,
  Edit3,
} from 'lucide-react'
import type { Pin, Status, PlaylistPart } from '../types'
import { extractYouTubeId, timecodeToSeconds, uid, buildYouTubeTimecodeUrl } from '../utils'
import { loadYouTubeIframeAPI, whenYTReady, formatTimecode } from '../utils/youtubeApi'
import type { YTPlayer } from '../utils/youtubeApi'
import { PlatformBadge, StatusBadge } from './Badges'
import { PinPoster } from './PinPoster'

interface PlayerModalProps {
  pin: Pin | null
  open: boolean
  onClose: () => void
  onUpdatePin: (updated: Pin) => void
}

type SidebarTab = 'timecodes' | 'notes' | 'parts'

// Regular expression to match [HH:MM:SS] or [MM:SS] markers
const TIMECODE_REGEX = /(\[\d{1,2}:\d{2}(?::\d{2})?\])/g

export const PlayerModal: React.FC<PlayerModalProps> = ({
  pin,
  open,
  onClose,
  onUpdatePin,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('notes')
  const [activeUrl, setActiveUrl] = useState(pin?.url || '')
  const [activePartTitle, setActivePartTitle] = useState<string | null>(null)
  const [activeTimecode, setActiveTimecode] = useState(pin?.timecode || '00:00:00')
  const [notesText, setNotesText] = useState(pin?.notes || pin?.note || '')
  const [notesViewMode, setNotesViewMode] = useState<'edit' | 'preview'>('edit')
  const [newMarkerTime, setNewMarkerTime] = useState('')
  const [newMarkerLabel, setNewMarkerLabel] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAddMarker, setShowAddMarker] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<YTPlayer | null>(null)
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep a stable ref to pin to prevent stale closures in timers
  const pinRef = useRef(pin)
  useEffect(() => {
    pinRef.current = pin
  }, [pin])

  // Sync state whenever active pin changes
  useEffect(() => {
    if (pin) {
      setActiveUrl(pin.url)
      setActivePartTitle(null)
      setActiveTimecode(pin.timecode || '00:00:00')
      setNotesText(pin.notes || pin.note || '')
      setNotesViewMode('edit')
    }
  }, [pin])

  const ytId = extractYouTubeId(activeUrl)

  // ─── Save Timecode helper ────────────────────────────────────────────────
  const saveTimecode = useCallback(
    (tc: string) => {
      setActiveTimecode(tc)
      const currentPin = pinRef.current
      if (currentPin) {
        onUpdatePin({
          ...currentPin,
          timecode: tc,
          updatedAt: new Date().toISOString(),
        })
      }
    },
    [onUpdatePin],
  )

  // ─── Read current time from YT Player and save ───────────────────────────
  const saveCurrentTimecodeFromPlayer = useCallback(() => {
    const player = ytPlayerRef.current
    if (!player) return
    try {
      const sec = Math.floor(player.getCurrentTime())
      if (!isNaN(sec) && sec >= 0) {
        const tc = formatTimecode(sec)
        saveTimecode(tc)
      }
    } catch {
      // Player might not be ready or destroyed
    }
  }, [saveTimecode])

  // ─── 5-second interval timer during PLAYING state ─────────────────────────
  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current)
      saveIntervalRef.current = null
    }
  }, [])

  const startAutoSave = useCallback(() => {
    stopAutoSave()
    saveIntervalRef.current = setInterval(() => {
      saveCurrentTimecodeFromPlayer()
    }, 5000)
  }, [stopAutoSave, saveCurrentTimecodeFromPlayer])

  // ─── Destroy player ──────────────────────────────────────────────────────
  const destroyPlayer = useCallback(() => {
    stopAutoSave()
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy()
      } catch {
        // ignore error
      }
      ytPlayerRef.current = null
    }
  }, [stopAutoSave])

  // ─── Initialize YT Player with startSeconds ──────────────────────────────
  const initPlayer = useCallback(
    async (videoId: string, startSec: number) => {
      destroyPlayer()
      await whenYTReady()

      if (!containerRef.current) return

      // Fresh target div inside container
      containerRef.current.innerHTML =
        '<div id="yt-player-target-slot" class="w-full h-full"></div>'

      try {
        ytPlayerRef.current = new window.YT.Player('yt-player-target-slot', {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            start: startSec > 0 ? startSec : undefined,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (startSec > 0) {
                try {
                  event.target.seekTo(startSec, true)
                } catch {
                  // ignore
                }
              }
            },
            onStateChange: (event) => {
              const state = event.data
              const YT = window.YT
              if (state === YT.PlayerState.PLAYING) {
                startAutoSave()
              } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) {
                stopAutoSave()
                saveCurrentTimecodeFromPlayer()
              }
            },
          },
        })
      } catch {
        // Fallback or error handled silently
      }
    },
    [destroyPlayer, startAutoSave, stopAutoSave, saveCurrentTimecodeFromPlayer],
  )

  // ─── Mount & Unmount Player effect ────────────────────────────────────────
  useEffect(() => {
    if (!open || !pin) {
      saveCurrentTimecodeFromPlayer()
      destroyPlayer()
      return
    }

    if (!ytId) return

    loadYouTubeIframeAPI()
    const startSec = pin.timecode ? timecodeToSeconds(pin.timecode) : 0
    if (pin.timecode) {
      setActiveTimecode(pin.timecode)
    }

    const timer = setTimeout(() => {
      void initPlayer(ytId, startSec)
    }, 100)

    return () => {
      clearTimeout(timer)
      saveCurrentTimecodeFromPlayer()
      destroyPlayer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ytId, activeUrl])

  // ─── Seek player to timecode ──────────────────────────────────────────────
  const seekPlayer = useCallback(
    (tc: string) => {
      const sec = timecodeToSeconds(tc)
      saveTimecode(formatTimecode(sec))
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(sec, true)
          return
        } catch {
          // ignore
        }
      }
      if (ytId) {
        void initPlayer(ytId, sec)
      }
    },
    [ytId, initPlayer, saveTimecode],
  )

  // ─── Get current playback time as formatted string ────────────────────────
  const getCurrentPlaybackTimecode = (): string => {
    if (ytPlayerRef.current) {
      try {
        const sec = Math.floor(ytPlayerRef.current.getCurrentTime())
        if (!isNaN(sec) && sec >= 0) {
          return formatTimecode(sec)
        }
      } catch {
        // fallback
      }
    }
    return activeTimecode || '00:00:00'
  }

  // ─── Insert [HH:MM:SS] marker into notes ─────────────────────────────────
  const handleInsertCurrentTimecode = () => {
    const stamp = getCurrentPlaybackTimecode()
    const marker = `[${stamp}] `
    const textarea = notesTextareaRef.current

    if (textarea) {
      const start = textarea.selectionStart ?? textarea.value.length
      const end = textarea.selectionEnd ?? textarea.value.length
      const prefix = start > 0 && notesText[start - 1] !== '\n' ? '\n' : ''
      const insertion = `${prefix}${marker}`
      const updated = notesText.substring(0, start) + insertion + notesText.substring(end)

      handleNotesChange(updated)
      setTimeout(() => {
        textarea.focus()
        const newPos = start + insertion.length
        textarea.setSelectionRange(newPos, newPos)
      }, 30)
    } else {
      const prefix = notesText.length > 0 && !notesText.endsWith('\n') ? '\n' : ''
      handleNotesChange(`${notesText}${prefix}${marker}`)
    }
  }

  // ─── Keyboard shortcut: Alt+T to insert timecode ──────────────────────────
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleInsertCurrentTimecode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, notesText]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Close handler ────────────────────────────────────────────────────────
  const handleClose = () => {
    saveCurrentTimecodeFromPlayer()
    destroyPlayer()
    onClose()
  }

  // ─── Part selection ───────────────────────────────────────────────────────
  const handleSelectPart = (part: PlaylistPart) => {
    saveCurrentTimecodeFromPlayer()
    setActiveUrl(part.url)
    setActivePartTitle(part.title)
    const tc = part.timecode || '00:00:00'
    setActiveTimecode(tc)
    const newYtId = extractYouTubeId(part.url)
    if (newYtId) {
      void initPlayer(newYtId, timecodeToSeconds(tc))
    }
  }

  const handleTogglePartCompleted = (partId: string) => {
    if (!pin) return
    const updatedParts = (pin.parts || []).map((p) =>
      p.id === partId ? { ...p, isCompleted: !p.isCompleted } : p,
    )
    onUpdatePin({ ...pin, parts: updatedParts, updatedAt: new Date().toISOString() })
  }

  // ─── Notes management ─────────────────────────────────────────────────────
  const handleNotesChange = (val: string) => {
    setNotesText(val)
    const currentPin = pinRef.current
    if (currentPin) {
      onUpdatePin({
        ...currentPin,
        notes: val,
        note: val.split('\n')[0].replace(/^[#\s*\-_]+/, '').slice(0, 120),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Bookmarks ────────────────────────────────────────────────────────────
  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || !newMarkerTime.trim()) return
    const newBm = {
      id: uid(),
      time: newMarkerTime.trim(),
      label: newMarkerLabel.trim() || `Маркер ${newMarkerTime.trim()}`,
    }
    const updated = [...(pin.timecodeBookmarks || []), newBm]
    onUpdatePin({ ...pin, timecodeBookmarks: updated, updatedAt: new Date().toISOString() })
    setNewMarkerTime('')
    setNewMarkerLabel('')
    setShowAddMarker(false)
  }

  const handleDeleteBookmark = (bmId: string) => {
    if (!pin) return
    const updated = (pin.timecodeBookmarks || []).filter((b) => b.id !== bmId)
    onUpdatePin({ ...pin, timecodeBookmarks: updated, updatedAt: new Date().toISOString() })
  }

  // ─── Episodes, Status, Rating ─────────────────────────────────────────────
  const handleEpisodeChange = (delta: number) => {
    if (!pin) return
    const cur = pin.currentEpisode ?? pin.currentEp ?? 1
    const next = Math.max(1, cur + delta)
    onUpdatePin({
      ...pin,
      currentEpisode: next,
      currentEp: next,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleStatusChange = (st: Status) => {
    if (!pin) return
    onUpdatePin({
      ...pin,
      status: st,
      isPinned: st === 'watching',
      updatedAt: new Date().toISOString(),
    })
  }

  const handleRatingChange = (r: number) => {
    if (!pin) return
    onUpdatePin({
      ...pin,
      rating: pin.rating === r ? undefined : r,
      updatedAt: new Date().toISOString(),
    })
  }

  // ─── Extract all timecode markers from notes ──────────────────────────────
  const extractedMarkers = useMemo(() => {
    const matches = notesText.match(TIMECODE_REGEX)
    if (!matches) return []
    // Unique list of markers in notes
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))))
  }, [notesText])

  // ─── Render notes with clickable timecodes ────────────────────────────────
  const renderInteractiveNotes = (text: string) => {
    const tokens = text.split(TIMECODE_REGEX)
    return tokens.map((token, idx) => {
      const match = token.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]$/)
      if (match) {
        const tc = match[1]
        return (
          <button
            key={idx}
            type="button"
            onClick={() => seekPlayer(tc)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-[rgba(243,229,171,0.14)] hover:bg-[rgba(243,229,171,0.28)] border border-[rgba(243,229,171,0.35)] text-[#f3e5ab] font-bold text-xs mono transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title={`Перемотать видео на ${tc}`}
          >
            <Play size={10} className="fill-current text-[#f3e5ab]" />
            <span>{tc}</span>
          </button>
        )
      }
      return <span key={idx}>{token}</span>
    })
  }

  if (!pin) return null

  const directExternalLink =
    pin.platform === 'youtube' && activeTimecode
      ? buildYouTubeTimecodeUrl(pin.url, activeTimecode)
      : pin.url

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="player-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            key="player-modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-modal w-full max-w-6xl rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[94vh] shadow-2xl bg-[#090b10]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-3.5 px-6 border-b border-white/[0.08] shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-3 min-w-0">
                <PlatformBadge platform={pin.platform} />
                <h3 className="text-sm sm:text-base font-semibold text-white truncate max-w-md sm:max-w-xl">
                  {pin.title}
                  {activePartTitle && (
                    <span className="text-xs text-[#f3e5ab] font-normal ml-2">
                      • {activePartTitle}
                    </span>
                  )}
                </h3>
                <StatusBadge status={pin.status} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Auto-tracking timecode badge */}
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10"
                  title="Текущая позиция (сохраняется автоматически)"
                >
                  <Timer size={13} className="text-[#f3e5ab]" />
                  <span className="text-xs text-[#f3e5ab] mono font-semibold">
                    {activeTimecode || '00:00:00'}
                  </span>
                </div>

                <a
                  href={directExternalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Открыть в браузере с нужного таймкода"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">В браузере</span>
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Закрыть плеер"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Split Body */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
              {/* Left Column: Player & Cinema View */}
              <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto space-y-4">
                <div className="space-y-4">
                  {/* Ambilight Cinema Player Frame */}
                  <div className="relative group">
                    <div
                      className="absolute -inset-2.5 rounded-3xl opacity-45 blur-2xl pointer-events-none transition-opacity duration-700 group-hover:opacity-70"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(243, 229, 171, 0.45), rgba(255, 42, 133, 0.45))',
                      }}
                    />

                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                      {ytId ? (
                        /* Official YouTube IFrame Player API Container */
                        <div ref={containerRef} className="w-full h-full" />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#07090e]">
                          <PinPoster
                            pin={pin}
                            className="absolute inset-0 w-full h-full opacity-30 blur-sm pointer-events-none"
                          />
                          <div className="relative z-10 space-y-3 max-w-md">
                            <Sparkles size={36} className="mx-auto text-[#f3e5ab]" />
                            <h4 className="text-base font-semibold text-white">
                              Внешний медиа-ресурс ({pin.platform.toUpperCase()})
                            </h4>
                            <p className="text-xs text-white/50">
                              Встраивание через YouTube API недоступно для этой ссылки.
                            </p>
                            <a
                              href={pin.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold shadow-lg cursor-pointer"
                            >
                              <ExternalLink size={14} /> Открыть на сайте {pin.platform}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Quick Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    {/* Timecode control */}
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[#f3e5ab]" />
                      <span className="text-xs text-white/50">Таймкод:</span>
                      <input
                        type="text"
                        value={activeTimecode}
                        onChange={(e) => setActiveTimecode(e.target.value)}
                        onBlur={() => seekPlayer(activeTimecode)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') seekPlayer(activeTimecode)
                        }}
                        placeholder="01:14:30"
                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-[#f3e5ab] text-center mono focus:border-[#f3e5ab]"
                        title="Нажмите Enter для перемотки"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = getCurrentPlaybackTimecode()
                          saveTimecode(cur)
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#f3e5ab] border border-white/5 cursor-pointer transition-colors"
                        title="Зафиксировать текущий таймкод плеера"
                      >
                        ⊙ Запомнить
                      </button>
                    </div>

                    {/* Episode Counter */}
                    {(pin.contentType === 'anime' || pin.contentType === 'series') && (
                      <div className="flex items-center gap-2">
                        <Tv size={15} className="text-[#ff2a85]" />
                        <span className="text-xs text-white/50">Серия:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEpisodeChange(-1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 bg-white/5 rounded-lg text-xs font-semibold text-white mono">
                            {pin.currentEpisode ?? pin.currentEp ?? 1}
                            {pin.totalEpisodes ?? pin.totalEp
                              ? ` / ${pin.totalEpisodes ?? pin.totalEp}`
                              : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEpisodeChange(1)}
                            className="w-7 h-7 rounded-lg btn-rose text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status switcher */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusChange('watching')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          pin.status === 'watching'
                            ? 'btn-gold text-[#f3e5ab] font-semibold'
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Смотрю
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange('completed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          pin.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold'
                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Завершено
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rating & Metadata Footer */}
                <div className="pt-3 flex items-center justify-between text-xs text-white/40 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] mr-1">Оценка:</span>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-0.5 text-white/20 hover:text-[#f3e5ab]"
                        style={{ color: pin.rating && pin.rating >= star ? '#f3e5ab' : undefined }}
                      >
                        <Star
                          size={13}
                          fill={pin.rating && pin.rating >= star ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    {pin.rating && (
                      <span className="ml-1 text-[#f3e5ab] font-bold mono">{pin.rating}/10</span>
                    )}
                  </div>
                  <span className="mono text-[11px]">
                    Добавлено: {new Date(pin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Right Column: Tabbed Panel */}
              <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-white/[0.01]">
                {/* Tabs Switcher: Конспект, Таймкоды, Части */}
                <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'notes'
                        ? 'btn-rose text-[#ff2a85] shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <FileText size={13} />
                    <span>Конспект</span>
                    {extractedMarkers.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] mono bg-black/30 text-[#ff2a85]">
                        {extractedMarkers.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('timecodes')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'timecodes'
                        ? 'btn-gold text-[#f3e5ab] shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Clock size={13} />
                    <span>Маркеры</span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] mono"
                      style={{
                        backgroundColor:
                          activeTab === 'timecodes'
                            ? 'rgba(0,0,0,0.25)'
                            : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {pin.timecodeBookmarks?.length || 0}
                    </span>
                  </button>

                  {pin.parts && pin.parts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('parts')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === 'parts'
                          ? 'btn-rose text-[#ff2a85] shadow-sm'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <ListVideo size={13} />
                      <span>Части</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] mono bg-black/30">
                        {pin.parts.filter((p) => p.isCompleted).length}/{pin.parts.length}
                      </span>
                    </button>
                  )}
                </div>

                {/* Tab 1: Конспект с кликабельными таймкодами */}
                {activeTab === 'notes' && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Top Action Bar of Notes */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider mono">
                          Конспект лекции
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Mode toggle (Edit vs Preview) */}
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => setNotesViewMode('edit')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                notesViewMode === 'edit'
                                  ? 'bg-white/15 text-white font-semibold'
                                  : 'text-white/40 hover:text-white'
                              }`}
                              title="Режим набора текста"
                            >
                              <Edit3 size={10} /> Текст
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotesViewMode('preview')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                notesViewMode === 'preview'
                                  ? 'bg-[#f3e5ab]/20 text-[#f3e5ab] font-semibold'
                                  : 'text-white/40 hover:text-white'
                              }`}
                              title="Интерактивный просмотр с кликабельными таймкодами"
                            >
                              <Eye size={10} /> Клик
                            </button>
                          </div>

                          {/* Copy Notes */}
                          <button
                            type="button"
                            onClick={handleCopyNotes}
                            className="text-xs text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Скопировать весь конспект в буфер обмена"
                          >
                            {copied ? (
                              <>
                                <Check size={12} className="text-green-400" />
                                <span className="text-green-400">Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Копия</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Prominent Primary CTA: «+ Текущий таймкод» */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInsertCurrentTimecode}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[rgba(243,229,171,0.15)] to-[rgba(255,42,133,0.15)] hover:from-[rgba(243,229,171,0.25)] hover:to-[rgba(255,42,133,0.25)] border border-[rgba(243,229,171,0.35)] text-[#f3e5ab] hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                          title="Вставить в текст конспекта метку текущего момента видео (Alt+T)"
                        >
                          <Clock size={13} className="text-[#f3e5ab]" />
                          <span>+ Текущий таймкод</span>
                          <span className="mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#f3e5ab] border border-[rgba(243,229,171,0.3)]">
                            [{getCurrentPlaybackTimecode()}]
                          </span>
                        </button>
                      </div>

                      {/* Clickable Quick Jump Chips from Notes */}
                      {extractedMarkers.length > 0 && (
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider mono">
                              Таймкоды в тексте ({extractedMarkers.length}):
                            </span>
                            <span className="text-[10px] text-white/30">клик = перемотка</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                            {extractedMarkers.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => seekPlayer(m)}
                                className="px-2 py-0.5 rounded-lg bg-[rgba(243,229,171,0.1)] hover:bg-[rgba(243,229,171,0.25)] border border-[rgba(243,229,171,0.25)] text-[#f3e5ab] text-[11px] mono font-semibold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title={`Перейти к ${m}`}
                              >
                                <Play size={8} className="fill-current" />
                                <span>{m}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes Body: Edit Mode (Textarea) vs Preview Mode (Clickable Rich Text) */}
                      {notesViewMode === 'edit' ? (
                        <textarea
                          ref={notesTextareaRef}
                          value={notesText}
                          onChange={(e) => handleNotesChange(e.target.value)}
                          placeholder="Пишите мысли, тезисы или нажимайте «+ Текущий таймкод»...&#10;&#10;Метки вида [01:12:45] автоматически становятся интерактивными ссылками!"
                          rows={11}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white/90 placeholder:text-white/25 focus:border-[#f3e5ab] transition-all resize-none leading-relaxed font-sans"
                        />
                      ) : (
                        <div
                          className="w-full min-h-[14rem] max-h-[19rem] overflow-y-auto bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white/85 leading-relaxed whitespace-pre-wrap select-text"
                          title="Кликайте на любые [таймкоды] для мгновенной перемотки"
                        >
                          {notesText.trim() ? (
                            renderInteractiveNotes(notesText)
                          ) : (
                            <span className="text-white/25 italic">
                              Конспект пока пуст. Нажмите «Текст» и добавьте заметки или таймкоды.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Status & Hints */}
                    <div className="flex items-center justify-between text-[11px] text-white/30 pt-2 border-t border-white/5">
                      <span className="mono">Alt+T — горячая клавиша метки</span>
                      <span className="text-emerald-400/80 flex items-center gap-1">
                        <Check size={11} /> автосохранение
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Маркеры внутри видео (Bookmark list) */}
                {activeTab === 'timecodes' && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider mono">
                          Сохраненные закладки
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!showAddMarker) {
                              setNewMarkerTime(getCurrentPlaybackTimecode())
                            }
                            setShowAddMarker(!showAddMarker)
                          }}
                          className="text-xs text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Plus size={13} />
                          <span>{showAddMarker ? 'Отмена' : 'Новый маркер'}</span>
                        </button>
                      </div>

                      {showAddMarker && (
                        <form
                          onSubmit={handleAddBookmark}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={newMarkerTime}
                              onChange={(e) => setNewMarkerTime(e.target.value)}
                              placeholder="00:18:30"
                              className="col-span-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#f3e5ab] mono text-center"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={newMarkerLabel}
                              onChange={(e) => setNewMarkerLabel(e.target.value)}
                              placeholder="Описание момента..."
                              className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-1.5 rounded-lg btn-gold text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                          >
                            <Bookmark size={12} /> Сохранить в список
                          </button>
                        </form>
                      )}

                      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                        {(!pin.timecodeBookmarks || pin.timecodeBookmarks.length === 0) &&
                        !showAddMarker ? (
                          <div className="py-8 text-center text-white/30 space-y-1">
                            <Clock size={24} className="mx-auto opacity-30" />
                            <p className="text-xs">Нет сохраненных маркеров</p>
                            <p className="text-[11px] text-white/20">
                              Добавьте ключевые моменты для быстрого перехода
                            </p>
                          </div>
                        ) : (
                          pin.timecodeBookmarks?.map((bm) => (
                            <div
                              key={bm.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
                            >
                              <button
                                type="button"
                                onClick={() => seekPlayer(bm.time)}
                                className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                                title="Перемотать плеер к этому моменту"
                              >
                                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(243,229,171,0.12)] border border-[rgba(243,229,171,0.25)] text-[#f3e5ab] font-bold shrink-0 mono">
                                  {bm.time}
                                </span>
                                <span className="text-xs text-white/80 truncate group-hover:text-white">
                                  {bm.label}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(bm.id)}
                                className="p-1 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Удалить маркер"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-white/30 text-center pt-2 border-t border-white/5">
                      Клик по метке мгновенно перематывает плеер
                    </div>
                  </div>
                )}

                {/* Tab 3: Части / Плейлист */}
                {activeTab === 'parts' && pin.parts && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider mono">
                          Части / Серии ({pin.parts.filter((p) => p.isCompleted).length}/
                          {pin.parts.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                        {pin.parts.map((part, idx) => {
                          const isCurrent = activeUrl === part.url
                          return (
                            <div
                              key={part.id}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                isCurrent
                                  ? 'bg-[rgba(243,229,171,0.08)] border-[#f3e5ab]/30'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePartCompleted(part.id)}
                                  className="text-white/40 hover:text-white cursor-pointer shrink-0"
                                  title={
                                    part.isCompleted
                                      ? 'Отметить непросмотренным'
                                      : 'Отметить просмотренным'
                                  }
                                >
                                  {part.isCompleted ? (
                                    <CheckSquare size={16} className="text-emerald-400" />
                                  ) : (
                                    <Square size={16} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectPart(part)}
                                  className="min-w-0 text-left flex-1 cursor-pointer"
                                  title="Запустить эту часть в плеере"
                                >
                                  <p
                                    className={`text-xs font-medium truncate ${
                                      part.isCompleted
                                        ? 'line-through text-white/40'
                                        : isCurrent
                                        ? 'text-[#f3e5ab] font-semibold'
                                        : 'text-white/80'
                                    }`}
                                  >
                                    <span className="mono text-[10px] mr-1.5 opacity-60">
                                      #{idx + 1}
                                    </span>
                                    {part.title}
                                  </p>
                                  {part.timecode && (
                                    <span className="text-[10px] mono text-white/40">
                                      {part.timecode}
                                    </span>
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectPart(part)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold mono cursor-pointer shrink-0 ${
                                  isCurrent
                                    ? 'btn-gold text-[#f3e5ab]'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {isCurrent ? 'Сейчас' : 'Включить'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="text-[11px] text-white/30 text-center pt-2 border-t border-white/5">
                      Клик переключает активное видео прямо в плеере
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
