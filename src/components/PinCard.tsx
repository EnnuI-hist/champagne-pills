import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Clock,
  Pin as PinIcon,
  Trash2,
  Copy,
  Check,
  Tv,
  BookOpen,
  FileText,
  Star,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Edit2,
} from 'lucide-react'
import type { Pin } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge, StatusBadge } from './Badges'

interface PinCardProps {
  pin: Pin
  onPlay: (pin: Pin) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onUpdateEpisode?: (id: string, newEp: number) => void
  onUpdateTimecode?: (id: string, newTimecode: string) => void
  onUpdateRating?: (id: string, newRating: number) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  onPlay,
  onTogglePin,
  onDelete,
  onUpdateEpisode,
  onUpdateTimecode,
  onUpdateRating,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const [copied, setCopied] = useState(false)
  const [isEditingTimecode, setIsEditingTimecode] = useState(false)
  const [tcInput, setTcInput] = useState(pin.timecode || '')

  const isEpisodic = pin.contentType === 'anime' || pin.contentType === 'series'
  const currentEp = pin.currentEpisode ?? pin.currentEp ?? 1
  const totalEp = pin.totalEpisodes ?? pin.totalEp

  const progressPercent =
    totalEp && totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const urlToCopy =
      pin.platform === 'youtube' && pin.timecode
        ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
        : pin.url
    navigator.clipboard.writeText(urlToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleEpChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation()
    if (onUpdateEpisode) {
      onUpdateEpisode(pin.id, Math.max(1, currentEp + delta))
    }
  }

  const handleSaveTimecode = (e?: React.FormEvent | React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditingTimecode(false)
    if (onUpdateTimecode && tcInput.trim() !== (pin.timecode || '')) {
      onUpdateTimecode(pin.id, tcInput.trim())
    }
  }

  const handleRatingClick = (e: React.MouseEvent, star: number) => {
    e.stopPropagation()
    if (onUpdateRating) {
      const next = pin.rating === star ? 0 : star
      onUpdateRating(pin.id, next)
    }
  }

  const directExternalLink =
    pin.platform === 'youtube' && pin.timecode
      ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
      : pin.url

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onPlay(pin)}
      className="glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:border-white/20 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between relative"
    >
      <div>
        {/* Thumbnail Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/60">
          {pin.thumbnailUrl || pin.customThumbnailUrl ? (
            <img
              src={pin.customThumbnailUrl || pin.thumbnailUrl}
              alt={pin.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 bg-gradient-to-br from-white/[0.03] to-transparent">
              <Play size={28} />
            </div>
          )}

          {/* Gradient Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060609] via-transparent to-black/50 opacity-80" />

          {/* Top Badges & Controls */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <PlatformBadge platform={pin.platform} />

            <div className="flex items-center gap-1">
              {/* Move up / down buttons */}
              {onMoveUp && canMoveUp && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveUp(pin.id)
                  }}
                  className="p-1 rounded-lg bg-black/50 hover:bg-black/80 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Переместить выше"
                >
                  <ChevronUp size={13} />
                </button>
              )}
              {onMoveDown && canMoveDown && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveDown(pin.id)
                  }}
                  className="p-1 rounded-lg bg-black/50 hover:bg-black/80 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Переместить ниже"
                >
                  <ChevronDown size={13} />
                </button>
              )}

              {/* Pin button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(pin.id)
                }}
                className={`p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
                  pin.isPinned
                    ? 'bg-[#ff2a85] text-white shadow-md'
                    : 'bg-black/50 text-white/60 hover:text-white hover:bg-black/70'
                }`}
                title={pin.isPinned ? 'Открепить из фокуса' : 'Закрепить в фокус'}
              >
                <PinIcon size={13} className={pin.isPinned ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Play hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
            <div className="p-3.5 rounded-2xl btn-gold shadow-2xl scale-90 group-hover:scale-100 transition-transform">
              <Play size={20} className="fill-current text-[#0b0d11]" />
            </div>
          </div>

          {/* Bottom Thumbnail Info: Stop Timecode & Status */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-10">
            {/* Inline timecode stop / quick open */}
            {isEditingTimecode ? (
              <div
                className="flex items-center gap-1 bg-black/80 p-0.5 px-1.5 rounded-lg border border-[#f3e5ab]/50"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={tcInput}
                  onChange={(e) => setTcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTimecode()
                    if (e.key === 'Escape') setIsEditingTimecode(false)
                  }}
                  placeholder="01:15:30"
                  className="w-16 bg-transparent text-[11px] text-[#f3e5ab] mono text-center focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTimecode}
                  className="text-green-400 p-0.5 hover:scale-110"
                >
                  <Check size={11} />
                </button>
              </div>
            ) : pin.timecode ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditingTimecode(true)
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-[#f3e5ab] hover:border-[#f3e5ab]/50 transition-colors mono group/tc"
                  title="Нажмите для быстрого изменения таймкода"
                >
                  <Clock size={11} className="text-[#f3e5ab]" />
                  <span>{pin.timecode}</span>
                  <Edit2 size={9} className="opacity-0 group-hover/tc:opacity-100 transition-opacity" />
                </button>

                <a
                  href={directExternalLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[#f3e5ab]/70 hover:text-[#f3e5ab] hover:border-[#f3e5ab]/50 transition-colors"
                  title="Открыть с таймкода в браузере"
                >
                  <ExternalLink size={11} />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingTimecode(true)
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white/40 hover:text-[#f3e5ab] mono transition-colors"
                title="Задать таймкод остановки"
              >
                <Clock size={10} />
                <span>+таймкод</span>
              </button>
            )}

            <StatusBadge status={pin.status} />
          </div>

          {/* Episodic Progress Bar with Neon Glow */}
          {progressPercent !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#f3e5ab] to-[#ff2a85] shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Title & Author */}
          <div>
            <h4 className="text-sm font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-[#f3e5ab] transition-colors">
              {pin.title}
            </h4>
            {pin.channelName && (
              <p className="text-xs text-white/40 mt-1 truncate">{pin.channelName}</p>
            )}
          </div>

          {/* History Sub-period badge */}
          {pin.historyPeriod && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[rgba(243,229,171,0.1)] border border-[rgba(243,229,171,0.2)] text-[11px] text-[#f3e5ab] font-medium">
              <span>🏛️</span>
              <span>{HISTORY_PERIOD_LABELS[pin.historyPeriod]}</span>
            </div>
          )}

          {/* Episodic Tracker controls (- and +1 right on card) */}
          {isEpisodic && (
            <div
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-white/80">
                  <Tv size={13} className="text-[#ff2a85]" />
                  <span className="mono font-semibold">
                    Серия {currentEp}
                    {totalEp ? ` / ${totalEp}` : ''}
                  </span>
                  {progressPercent !== null && (
                    <span className="text-[10px] text-[#ff2a85] font-bold mono">
                      ({progressPercent}%)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleEpChange(e, -1)}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                    title="Предыдущая серия"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleEpChange(e, 1)}
                    className="w-6 h-6 rounded-lg btn-rose text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-md transition-transform hover:scale-105"
                    title="Следующая серия (+1)"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Dub studio badge */}
              {pin.dubStudio && (
                <div className="flex items-center justify-between text-[10px] text-white/40 pt-0.5">
                  <span>Озвучка:</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[#f3e5ab]">
                    {pin.dubStudio}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lecture Progress */}
          {pin.lectureNumber && (
            <div className="flex items-center gap-1.5 text-xs text-white/60 mono">
              <BookOpen size={13} className="text-[#f3e5ab]" />
              <span>
                Лекция {pin.lectureNumber}
                {pin.totalLectures ? ` из ${pin.totalLectures}` : ''}
              </span>
            </div>
          )}

          {/* Notes preview */}
          {(pin.note || pin.notes) && (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 line-clamp-2 leading-relaxed flex items-start gap-1.5">
              <FileText size={12} className="shrink-0 mt-0.5 text-white/30" />
              <span>{pin.note || pin.notes}</span>
            </div>
          )}

          {/* Tags */}
          {pin.tags && pin.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pin.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 hover:text-white/70 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions: Rating & Quick Buttons */}
      <div
        className="p-3 px-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rating stars (1-10) clickable */}
        <div className="flex items-center gap-0.5" title="Оценить тайтл (1-10)">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              onClick={(e) => handleRatingClick(e, star)}
              className="p-0.5 text-white/20 hover:text-[#f3e5ab] transition-colors"
              style={{
                color: pin.rating && pin.rating >= star ? '#f3e5ab' : undefined,
              }}
            >
              <Star
                size={11}
                fill={pin.rating && pin.rating >= star ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          {pin.rating ? (
            <span className="ml-1 text-[11px] text-[#f3e5ab] font-bold mono">
              {pin.rating}
            </span>
          ) : null}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Скопировать ссылку с таймкодом"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>

          <a
            href={directExternalLink}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Открыть в новой вкладке"
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={() => onDelete(pin.id)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Переместить в корзину"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
