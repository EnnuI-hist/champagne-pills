import React, { useState } from 'react'
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
  Sparkles,
} from 'lucide-react'
import type { Pin, Status } from '../types'
import { extractYouTubeId, timecodeToSeconds, uid, buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge, StatusBadge } from './Badges'

interface PlayerModalProps {
  pin: Pin | null
  open: boolean
  onClose: () => void
  onUpdatePin: (updated: Pin) => void
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  pin,
  open,
  onClose,
  onUpdatePin,
}) => {
  if (!pin) return null

  const [activeTimecode, setActiveTimecode] = useState(pin.timecode || '')
  const [notesText, setNotesText] = useState(pin.notes || pin.note || '')
  const [newMarkerTime, setNewMarkerTime] = useState('')
  const [newMarkerLabel, setNewMarkerLabel] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAddMarker, setShowAddMarker] = useState(false)

  const ytId = extractYouTubeId(pin.url)
  const startSec = activeTimecode ? timecodeToSeconds(activeTimecode) : 0
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1${startSec > 0 ? `&start=${startSec}` : ''}`
    : null

  // Save notes on blur
  const handleNotesChange = (val: string) => {
    setNotesText(val)
    onUpdatePin({
      ...pin,
      notes: val,
      note: val.split('\n')[0].replace(/^[#\s*-_]+/, '').slice(0, 120),
      updatedAt: new Date().toISOString(),
    })
  }

  // Copy notes to clipboard
  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Update stop timecode
  const handleSetTimecode = (tc: string) => {
    setActiveTimecode(tc)
    onUpdatePin({
      ...pin,
      timecode: tc,
      updatedAt: new Date().toISOString(),
    })
  }

  // Bookmark navigation
  const handleJumpToBookmark = (time: string) => {
    handleSetTimecode(time)
  }

  // Add new bookmark
  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMarkerTime.trim()) return

    const newBm = {
      id: uid(),
      time: newMarkerTime.trim(),
      label: newMarkerLabel.trim() || `Маркер ${newMarkerTime.trim()}`,
    }

    const currentBms = pin.timecodeBookmarks || []
    const updated = [...currentBms, newBm]

    onUpdatePin({
      ...pin,
      timecodeBookmarks: updated,
      updatedAt: new Date().toISOString(),
    })

    setNewMarkerTime('')
    setNewMarkerLabel('')
    setShowAddMarker(false)
  }

  // Delete bookmark
  const handleDeleteBookmark = (bmId: string) => {
    const updated = (pin.timecodeBookmarks || []).filter((b) => b.id !== bmId)
    onUpdatePin({
      ...pin,
      timecodeBookmarks: updated,
      updatedAt: new Date().toISOString(),
    })
  }

  // Episode change
  const handleEpisodeChange = (delta: number) => {
    const cur = pin.currentEpisode ?? pin.currentEp ?? 1
    const next = Math.max(1, cur + delta)
    onUpdatePin({
      ...pin,
      currentEpisode: next,
      currentEp: next,
      updatedAt: new Date().toISOString(),
    })
  }

  // Status toggle
  const handleStatusChange = (st: Status) => {
    onUpdatePin({
      ...pin,
      status: st,
      isPinned: st === 'watching',
      updatedAt: new Date().toISOString(),
    })
  }

  // Rating change
  const handleRatingChange = (r: number) => {
    onUpdatePin({
      ...pin,
      rating: pin.rating === r ? undefined : r,
      updatedAt: new Date().toISOString(),
    })
  }

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
          onClick={onClose}
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
                </h3>
                <StatusBadge status={pin.status} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={directExternalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Открыть в новой вкладке браузера"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">В браузере</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Split Body: Left Player, Right Notes & Trackers */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
              {/* Left Column: Player & Video Controls */}
              <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto">
                <div className="space-y-4">
                  {/* Ambilight Cinema Player */}
                  <div className="relative group">
                    {/* Ambilight Ambient Glow Effect */}
                    <div
                      className="absolute -inset-2 rounded-2xl opacity-40 blur-2xl pointer-events-none transition-opacity group-hover:opacity-60"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(243, 229, 171, 0.4), rgba(255, 42, 133, 0.4))',
                      }}
                    />

                    {/* Embedded Frame or Poster Banner */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={pin.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#07090e]">
                          {pin.thumbnailUrl || pin.customThumbnailUrl ? (
                            <img
                              src={pin.customThumbnailUrl || pin.thumbnailUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                            />
                          ) : null}
                          <div className="relative z-10 space-y-3 max-w-md">
                            <Sparkles size={36} className="mx-auto text-[#f3e5ab]" />
                            <h4 className="text-base font-semibold text-white">
                              Внешний медиа-ресурс ({pin.platform})
                            </h4>
                            <p className="text-xs text-white/50">
                              Платформа не поддерживает прямое встраивание через iframe или требует авторизации.
                            </p>
                            <a
                              href={pin.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold shadow-lg cursor-pointer"
                            >
                              <ExternalLink size={14} /> Открыть на сайте {pin.platform.toUpperCase()}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Quick Bar: Stop Timecode & Episode Counter */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    {/* Timecode control */}
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[#f3e5ab]" />
                      <span className="text-xs text-white/50">Таймкод остановки:</span>
                      <input
                        type="text"
                        value={activeTimecode}
                        onChange={(e) => handleSetTimecode(e.target.value)}
                        placeholder="01:14:30"
                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-[#f3e5ab] text-center mono focus:border-[#f3e5ab]"
                      />
                    </div>

                    {/* Episode Counter if episodic */}
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
                          <span
                            className="px-2 py-1 bg-white/5 rounded-lg text-xs font-semibold text-white mono"
                          >
                            {pin.currentEpisode ?? pin.currentEp ?? 1}
                            {pin.totalEpisodes ?? pin.totalEp ? ` / ${pin.totalEpisodes ?? pin.totalEp}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEpisodeChange(1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 flex items-center justify-center font-bold text-xs cursor-pointer"
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
                <div className="pt-4 flex items-center justify-between text-xs text-white/40 border-t border-white/5 mt-4">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] mr-1">Оценка:</span>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-0.5 text-white/20 hover:text-[#f3e5ab]"
                        style={{
                          color: pin.rating && pin.rating >= star ? '#f3e5ab' : undefined,
                        }}
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

              {/* Right Column: Split-Screen Notes & Bookmark Timecodes */}
              <div className="lg:col-span-4 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4 bg-white/[0.01]">
                {/* Notes Header with Copy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider block"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Конспект и ключевые мысли
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyNotes}
                      className="text-xs text-[#f3e5ab] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-400" />
                          <span className="text-green-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Скопировать</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Notes Textarea */}
                  <textarea
                    value={notesText}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Записывайте ключевые даты, формулы, цитаты и выводы лекции..."
                    rows={8}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white/90 placeholder:text-white/25 focus:border-[#f3e5ab] transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Bookmark Timecodes */}
                <div className="space-y-2 pt-2 border-t border-white/5 flex-1">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] text-white/40 uppercase tracking-wider block"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Таймкод-маркеры ({pin.timecodeBookmarks?.length || 0})
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddMarker(!showAddMarker)}
                      className="text-xs text-[#ff2a85] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Plus size={13} />
                      <span>{showAddMarker ? 'Отмена' : 'Добавить'}</span>
                    </button>
                  </div>

                  {/* Add Bookmark Form */}
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
                          placeholder="00:15:20"
                          className="col-span-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#f3e5ab] mono text-center"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newMarkerLabel}
                          onChange={(e) => setNewMarkerLabel(e.target.value)}
                          placeholder="Тема маркера"
                          className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg btn-rose text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Bookmark size={12} /> Сохранить таймкод
                      </button>
                    </form>
                  )}

                  {/* Bookmark List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(!pin.timecodeBookmarks || pin.timecodeBookmarks.length === 0) &&
                    !showAddMarker ? (
                      <p className="text-[11px] text-white/30 italic py-2">
                        Нет сохраненных меток. Нажмите «Добавить», чтобы зафиксировать момент.
                      </p>
                    ) : (
                      pin.timecodeBookmarks?.map((bm) => (
                        <div
                          key={bm.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all group"
                        >
                          <button
                            type="button"
                            onClick={() => handleJumpToBookmark(bm.time)}
                            className="flex items-center gap-2 min-w-0 text-left flex-1 cursor-pointer"
                          >
                            <span
                              className="text-xs px-2 py-0.5 rounded bg-[rgba(243,229,171,0.1)] text-[#f3e5ab] font-semibold shrink-0 mono"
                            >
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
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
