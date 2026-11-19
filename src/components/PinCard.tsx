import React, { useState, useEffect, useRef } from 'react'
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
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ListVideo,
  CheckSquare,
  Square,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Edit2,
} from 'lucide-react'
import type { Pin, PlaylistPart, Status } from '../types'
import { buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge, StatusBadge } from './Badges'
import { PinPoster } from './PinPoster'

interface PinCardProps {
  pin: Pin
  onPlay: (pin: Pin) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onUpdateStatus?: (id: string, status: Status) => void
  onUpdateEpisode?: (id: string, newEp: number) => void
  onUpdateTimecode?: (id: string, newTimecode: string) => void
  onUpdateRating?: (id: string, newRating: number) => void
  onTogglePart?: (pinId: string, partId: string) => void
  onPlayPart?: (pin: Pin, part: PlaylistPart) => void
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
  onUpdateStatus,
  onUpdateEpisode,
  onUpdateTimecode,
  onUpdateRating,
  onTogglePart,
  onPlayPart,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingTimecode, setIsEditingTimecode] = useState(false)
  const [tcInput, setTcInput] = useState(pin.timecode || '')
  const [showParts, setShowParts] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isEpisodic = pin.contentType === 'anime' || pin.contentType === 'series'
  const currentEp = pin.currentEpisode ?? pin.currentEp ?? 1
  const totalEp = pin.totalEpisodes ?? pin.totalEp

  const progressPercent =
    totalEp && totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : null

  // Multi-part stats
  const hasParts = Boolean(pin.parts && pin.parts.length > 0)
  const completedPartsCount = pin.parts?.filter((p) => p.isCompleted).length || 0
  const totalPartsCount = pin.parts?.length || 0

  // Close context menu on click outside
  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [showMenu])

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation()
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

  const handleRatingClick = (star: number) => {
    if (onUpdateRating) {
      const next = pin.rating === star ? 0 : star
      onUpdateRating(pin.id, next)
    }
  }

  const directExternalLink =
    pin.platform === 'youtube' && pin.timecode
      ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
      : pin.url

  // Primary action button label
  const primaryButtonLabel = pin.timecode
    ? `Смотреть с ${pin.timecode}`
    : isEpisodic
    ? `Серия ${currentEp}`
    : 'Смотреть'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onPlay(pin)}
      className={`glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between relative h-full border ${
        pin.isPinned
          ? 'border-[#f3e5ab]/60 shadow-[0_0_20px_rgba(243,229,171,0.16)] ring-1 ring-[#f3e5ab]/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex flex-col flex-1">
        {/* Thumbnail Banner with Fallback (No broken browser images, no duplicated title!) */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/60 shrink-0">
          <PinPoster pin={pin} />

          {/* Top Badges & Controls */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-auto">
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
                  className="p-1 rounded-lg bg-black/60 hover:bg-black/85 text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5"
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
                  className="p-1 rounded-lg bg-black/60 hover:bg-black/85 text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5"
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
                className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                  pin.isPinned
                    ? 'bg-[#ff2a85] text-white shadow-md'
                    : 'bg-black/60 text-white/60 hover:text-white hover:bg-black/80 border border-white/5'
                }`}
                title={pin.isPinned ? 'Открепить из топа' : 'Закрепить в топ'}
              >
                <PinIcon size={13} className={pin.isPinned ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Play hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 backdrop-blur-[2px]">
            <div className="p-3 rounded-2xl btn-gold shadow-2xl scale-90 group-hover:scale-100 transition-transform">
              <Play size={18} className="fill-current text-[#0b0d11]" />
            </div>
          </div>

          {/* Bottom Thumbnail Info: Status badge */}
          <div className="absolute bottom-2 right-2.5 z-10">
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

        {/* Card Body - Compact and balanced without vertical voids */}
        <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-start">
          {/* Title & Channel & Rating Badge */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-[#f3e5ab] transition-colors flex-1">
                {pin.title}
              </h4>
              {pin.rating ? (
                <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#f3e5ab]/10 border border-[#f3e5ab]/30 text-[10px] text-[#f3e5ab] font-bold mono">
                  ★ {pin.rating}
                </span>
              ) : null}
            </div>
            {pin.channelName && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{pin.channelName}</p>
            )}
          </div>

          {/* Multi-part Playlist Support */}
          {hasParts && (
            <div
              className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowParts(!showParts)}
                  className="flex items-center gap-1.5 text-[#f3e5ab] font-semibold hover:underline cursor-pointer"
                >
                  <ListVideo size={13} />
                  <span>Части ({completedPartsCount}/{totalPartsCount})</span>
                </button>
                <span className="text-[10px] text-white/40 mono">
                  {Math.round((completedPartsCount / Math.max(1, totalPartsCount)) * 100)}%
                </span>
              </div>

              {/* Progress bar of parts */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f3e5ab] to-[#ff2a85]"
                  style={{
                    width: `${Math.round((completedPartsCount / Math.max(1, totalPartsCount)) * 100)}%`,
                  }}
                />
              </div>

              {/* Collapsible parts list */}
              {showParts && (
                <div className="space-y-1 pt-1 max-h-36 overflow-y-auto pr-1">
                  {pin.parts?.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-colors text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onTogglePart?.(pin.id, part.id)}
                        className="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer"
                        title={part.isCompleted ? 'Отметить как не просмотрено' : 'Отметить как просмотрено'}
                      >
                        {part.isCompleted ? (
                          <CheckSquare size={13} className="text-green-400 shrink-0" />
                        ) : (
                          <Square size={13} className="text-white/30 shrink-0" />
                        )}
                        <span
                          className={`truncate text-[11px] ${
                            part.isCompleted ? 'line-through text-white/40' : 'text-white/80'
                          }`}
                        >
                          {part.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={() => onPlayPart?.(pin, part)}
                          className="p-1 rounded text-[#f3e5ab] hover:bg-white/10"
                          title="Воспроизвести эту часть"
                        >
                          <Play size={11} fill="currentColor" />
                        </button>
                        <a
                          href={part.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-white/30 hover:text-white"
                          title="Открыть ссылку"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Episodic Tracker controls (- and +1 right on card) */}
          {isEpisodic && (
            <div
              className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
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

          {/* Non-episodic Timecode Tracker Box (Regular videos, lectures, essays) */}
          {!isEpisodic && (
            <div
              className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 text-white/80">
                <Clock size={13} className="text-[#f3e5ab]" />
                <span className="text-[11px] text-white/45">Таймкод:</span>
                <span className="mono font-semibold text-[#f3e5ab] text-xs">
                  {pin.timecode || '00:00:00'}
                </span>
              </div>

              {isEditingTimecode ? (
                <div className="flex items-center gap-1 bg-black/90 px-1.5 py-0.5 rounded-lg border border-[#f3e5ab]/50 shadow-md">
                  <input
                    type="text"
                    value={tcInput}
                    onChange={(e) => setTcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTimecode()
                      if (e.key === 'Escape') setIsEditingTimecode(false)
                    }}
                    placeholder="00:15:30"
                    className="w-16 bg-transparent text-[11px] text-[#f3e5ab] mono text-center focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveTimecode}
                    className="text-green-400 p-0.5 hover:scale-110 cursor-pointer"
                    title="Сохранить таймкод"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTcInput(pin.timecode || '00:00:00')
                    setIsEditingTimecode(true)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#f3e5ab] border border-white/5 transition-colors cursor-pointer text-[11px]"
                  title="Быстро изменить таймкод в 1 клик"
                >
                  <Edit2 size={11} />
                  <span>Изменить</span>
                </button>
              )}
            </div>
          )}

          {/* Lecture Progress (if applicable) */}
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
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 line-clamp-2 leading-relaxed flex items-start gap-1.5">
              <FileText size={12} className="shrink-0 mt-0.5 text-white/30" />
              <span>{pin.note || pin.notes}</span>
            </div>
          )}

          {/* Tags */}
          {pin.tags && pin.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
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

      {/* ── Minimalist Clean Footer: Single Primary Action + Context Menu (•••) ── */}
      <div
        className="p-2.5 px-3.5 sm:px-4 border-t border-white/[0.06] flex items-center gap-2 relative shrink-0 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Single Primary Action Button */}
        <button
          type="button"
          onClick={() => onPlay(pin)}
          className="flex-1 py-2 px-3.5 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Play size={13} className="fill-current text-[#0b0d11]" />
          <span className="truncate">{primaryButtonLabel}</span>
        </button>

        {/* Actions Menu Trigger (•••) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              showMenu
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/5'
            }`}
            title="Действия"
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Context Dropdown Popover */}
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-[#0f1017]/95 backdrop-blur-xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-1.5 z-50 text-xs text-white/80 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
              {/* Change Timecode */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  setTcInput(pin.timecode || '00:00:00')
                  setIsEditingTimecode(true)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#f3e5ab] text-left transition-colors cursor-pointer"
              >
                <Clock size={13} className="text-[#f3e5ab]" />
                <span>{pin.timecode ? 'Изменить таймкод' : 'Задать таймкод'}</span>
              </button>

              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-green-400" />
                    <span className="text-green-400 font-medium">Ссылка скопирована!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Скопировать ссылку</span>
                  </>
                )}
              </button>

              {/* Open in browser */}
              <a
                href={directExternalLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors"
              >
                <ExternalLink size={13} />
                <span>Открыть в браузере</span>
              </a>

              {/* Status / Archive */}
              {onUpdateStatus && (
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = pin.status === 'archived' ? 'queued' : 'archived'
                    onUpdateStatus(pin.id, nextStatus)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                >
                  {pin.status === 'archived' ? (
                    <>
                      <RotateCcw size={13} className="text-green-400" />
                      <span>Вернуть из архива</span>
                    </>
                  ) : (
                    <>
                      <Archive size={13} className="text-amber-400" />
                      <span>Перенести в архив</span>
                    </>
                  )}
                </button>
              )}

              {/* Rating (1-10) neatly inside menu */}
              {onUpdateRating && (
                <div className="px-2.5 py-1.5 border-t border-b border-white/[0.08] my-1">
                  <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                    <span>Оценка тайтла</span>
                    {pin.rating ? (
                      <span className="text-[#f3e5ab] font-bold">★ {pin.rating}/10</span>
                    ) : (
                      <span>Не оценено</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className={`text-[10px] font-bold p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                          pin.rating && pin.rating >= star ? 'text-[#f3e5ab]' : 'text-white/25'
                        }`}
                        title={`${star} из 10`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  onDelete(pin.id)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-red-400 text-left transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Удалить</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
