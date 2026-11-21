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
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ListVideo,
  CheckSquare,
  Square,
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
  onEditPin: (pin: Pin) => void
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
  onEditPin,
  onUpdateEpisode,
  onUpdateTimecode,
  onTogglePart,
  onPlayPart,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const [copied, setCopied] = useState(false)
  const [isEditingTimecode, setIsEditingTimecode] = useState(false)
  const [tcInput, setTcInput] = useState(pin.timecode || '')
  const [showParts, setShowParts] = useState(false)

  const isEpisodic = pin.contentType === 'anime' || pin.contentType === 'series'
  const currentEp = pin.currentEpisode ?? pin.currentEp ?? 1
  const totalEp = pin.totalEpisodes ?? pin.totalEp

  const progressPercent =
    totalEp && totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : null

  // Multi-part stats
  const hasParts = Boolean(pin.parts && pin.parts.length > 0)
  const completedPartsCount = pin.parts?.filter((p) => p.isCompleted).length || 0
  const totalPartsCount = pin.parts?.length || 0

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

  const directExternalLink =
    pin.platform === 'youtube' && pin.timecode
      ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
      : pin.url

  // Playlist / Next unwatched part calculations
  const nextUnwatchedPart = pin.parts?.find((p) => !p.isCompleted) || pin.parts?.[0]
  const nextPartIndex = nextUnwatchedPart && pin.parts ? pin.parts.indexOf(nextUnwatchedPart) : -1
  const isAllPartsCompleted = hasParts && completedPartsCount === totalPartsCount && totalPartsCount > 0
  const partsProgressPercent = hasParts
    ? Math.round((completedPartsCount / Math.max(1, totalPartsCount)) * 100)
    : 0

  const currentVideoNum =
    nextPartIndex !== -1
      ? nextPartIndex + 1
      : totalPartsCount > 0
      ? totalPartsCount
      : 1

  const handlePlaylistStep = (delta: number) => {
    if (!pin.parts || pin.parts.length === 0) return
    if (delta > 0) {
      if (nextUnwatchedPart && onTogglePart) {
        onTogglePart(pin.id, nextUnwatchedPart.id)
      }
    } else {
      const lastCompleted = [...pin.parts].reverse().find((p) => p.isCompleted)
      if (lastCompleted && onTogglePart) {
        onTogglePart(pin.id, lastCompleted.id)
      }
    }
  }

  // Primary action button label
  const primaryButtonLabel = hasParts
    ? isAllPartsCompleted
      ? 'Смотреть с начала'
      : `Смотреть #${nextPartIndex + 1}`
    : pin.timecode
    ? `Смотреть с ${pin.timecode}`
    : isEpisodic
    ? `Серия ${currentEp}`
    : 'Смотреть'

  const handleCardClick = () => {
    if (hasParts && nextUnwatchedPart && onPlayPart) {
      onPlayPart(pin, nextUnwatchedPart)
    } else {
      onPlay(pin)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={`glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between relative h-full border ${
        pin.isPinned
          ? 'border-[#f3e5ab]/60 shadow-[0_0_20px_rgba(243,229,171,0.16)] ring-1 ring-[#f3e5ab]/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex flex-col flex-1">
        {/* Thumbnail Banner with Fallback */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/60 shrink-0">
          <PinPoster pin={pin} />

          {/* Top Badges & Explicit Action Buttons Bar */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-auto">
            <PlatformBadge platform={pin.platform} />

            <div className="flex items-center gap-1.5">
              {/* Optional Move up / down buttons */}
              {onMoveUp && canMoveUp && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveUp(pin.id)
                  }}
                  className="p-1 rounded-lg bg-black/60 hover:bg-black/85 text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Переместить выше"
                >
                  <ChevronUp size={12} />
                </button>
              )}
              {onMoveDown && canMoveDown && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveDown(pin.id)
                  }}
                  className="p-1 rounded-lg bg-black/60 hover:bg-black/85 text-white/50 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Переместить ниже"
                >
                  <ChevronDown size={12} />
                </button>
              )}

              {/* ── Action Icons Bar: Pin + Edit + Delete in 1-Click ── */}
              <div
                className="flex items-center gap-1 p-0.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1) Pin в топ */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePin(pin.id)
                  }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    pin.isPinned
                      ? 'bg-[#ff2a85] text-white shadow-[0_0_10px_rgba(255,42,133,0.5)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={pin.isPinned ? 'Открепить из топа' : 'Закрепить в топ (Pin)'}
                >
                  <PinIcon size={13} className={pin.isPinned ? 'fill-current' : ''} />
                </button>

                {/* 2) Редактировать карточку (карандаш) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditPin(pin)
                  }}
                  className="p-1.5 rounded-lg text-white/60 hover:text-[#f3e5ab] hover:bg-white/10 transition-all cursor-pointer"
                  title="Редактировать закреп (все поля)"
                >
                  <Edit2 size={13} />
                </button>

                {/* 3) Удалить карточку (корзина) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(pin.id)
                  }}
                  className="p-1.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  title="Удалить закреп (в корзину с Undo)"
                >
                  <Trash2 size={13} />
                </button>
              </div>
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
          {/* Multi-part Playlist Support */}
          {hasParts && (
            <div
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with counter `Видео X / Y` with - and + buttons */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-white/90">
                  <ListVideo size={13} className="text-[#ff2a85]" />
                  <span className="mono font-semibold text-[#f3e5ab]">
                    Видео {currentVideoNum} / {totalPartsCount}
                  </span>
                  <span className="text-[10px] text-[#ff2a85] font-bold mono">
                    ({partsProgressPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaylistStep(-1)
                    }}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                    title="Предыдущее видео (снять отметку)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaylistStep(1)
                    }}
                    className="w-6 h-6 rounded-lg btn-rose text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-md transition-transform hover:scale-105"
                    title="Следующее видео (+1, отметить)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Progress bar of parts */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f3e5ab] to-[#ff2a85] shadow-[0_0_8px_rgba(243,229,171,0.5)] transition-all duration-300"
                  style={{ width: `${partsProgressPercent}%` }}
                />
              </div>

              {/* Primary Launch Unwatched Part Button */}
              {nextUnwatchedPart && !isAllPartsCompleted ? (
                <button
                  type="button"
                  onClick={() => onPlayPart?.(pin, nextUnwatchedPart)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-[rgba(243,229,171,0.08)] hover:bg-[rgba(243,229,171,0.18)] border border-[#f3e5ab]/30 hover:border-[#f3e5ab]/50 text-left flex items-center justify-between text-xs text-[#f3e5ab] transition-all cursor-pointer group/btn"
                  title={`Смотреть: #${nextPartIndex + 1} ${nextUnwatchedPart.title}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Play size={10} className="fill-current text-[#f3e5ab] shrink-0" />
                    <span className="truncate text-[11px] text-white/90">
                      <span className="mono font-bold text-[#f3e5ab] mr-1">#{nextPartIndex + 1}</span>
                      {nextUnwatchedPart.title}
                    </span>
                  </div>
                  <span className="text-[10px] mono text-[#f3e5ab] shrink-0 ml-1 group-hover/btn:underline">
                    Смотреть ▶
                  </span>
                </button>
              ) : isAllPartsCompleted ? (
                <div className="py-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium">
                    <Check size={12} /> Все {totalPartsCount} видео просмотрены
                  </span>
                  {pin.parts?.[0] && (
                    <button
                      type="button"
                      onClick={() => onPlayPart?.(pin, pin.parts![0])}
                      className="text-[10px] text-white/50 hover:text-white underline cursor-pointer"
                    >
                      Сначала
                    </button>
                  )}
                </div>
              ) : null}

              {/* Collapsible toggle button */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowParts(!showParts)}
                  className="flex items-center gap-1.5 text-[11px] text-[#f3e5ab]/80 hover:text-[#f3e5ab] font-medium transition-colors cursor-pointer"
                >
                  <span>{showParts ? 'Свернуть трек-лист' : `Список роликов (${completedPartsCount}/${totalPartsCount})`}</span>
                  {showParts ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {/* Collapsible parts list */}
              {showParts && (
                <div className="space-y-1 pt-1 max-h-44 overflow-y-auto pr-1">
                  {pin.parts?.map((part, idx) => {
                    const isNext = !part.isCompleted && part.id === nextUnwatchedPart?.id
                    return (
                      <div
                        key={part.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors text-xs ${
                          isNext
                            ? 'bg-[rgba(243,229,171,0.06)] border-[#f3e5ab]/30'
                            : 'bg-white/[0.02] hover:bg-white/5 border-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onTogglePart?.(pin.id, part.id)}
                          className="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer"
                          title={part.isCompleted ? 'Отметить как не просмотрено' : 'Отметить как просмотрено'}
                        >
                          {part.isCompleted ? (
                            <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-white/30 hover:text-white/60 shrink-0" />
                          )}
                          <span
                            className={`truncate text-[11px] ${
                              part.isCompleted ? 'line-through text-white/40' : 'text-white/85'
                            }`}
                          >
                            <span className="mono text-[10px] mr-1 opacity-50">#{idx + 1}</span>
                            {part.title}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={() => onPlayPart?.(pin, part)}
                            className="p-1 rounded text-[#f3e5ab] hover:bg-white/10 cursor-pointer"
                            title="Воспроизвести эту часть"
                          >
                            <Play size={11} fill="currentColor" />
                          </button>
                          <a
                            href={part.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-white/30 hover:text-white"
                            title="Открыть ссылку на YouTube"
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Episodic Tracker controls (- and +1 right on card) */}
          {isEpisodic && !hasParts && (
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
          {!isEpisodic && !hasParts && (
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

      {/* ── 1-Click Clean Footer: Primary Action + Copy + External Link (No hidden menus!) ── */}
      <div
        className="p-2.5 px-3.5 sm:px-4 border-t border-white/[0.06] flex items-center gap-2 relative shrink-0 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleCardClick}
          className="flex-1 py-2 px-3.5 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Play size={13} className="fill-current text-[#0b0d11]" />
          <span className="truncate">{primaryButtonLabel}</span>
        </button>

        {/* 1-Click Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-colors cursor-pointer"
          title="Скопировать ссылку с таймкодом"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>

        {/* 1-Click Open in Browser */}
        <a
          href={directExternalLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-colors"
          title="Открыть в браузере"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </motion.div>
  )
}
