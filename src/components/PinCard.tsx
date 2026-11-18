import React, { useState } from 'react'
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
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  onPlay,
  onTogglePin,
  onDelete,
  onUpdateEpisode,
}) => {
  const [copied, setCopied] = useState(false)

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

  const directExternalLink =
    pin.platform === 'youtube' && pin.timecode
      ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
      : pin.url

  return (
    <div
      onClick={() => onPlay(pin)}
      className="glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:border-white/20 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between"
    >
      <div>
        {/* Thumbnail area */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#060609] via-transparent to-black/40 opacity-80" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <PlatformBadge platform={pin.platform} />

            <div className="flex items-center gap-1.5">
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
                title={pin.isPinned ? 'Открепить' : 'Закрепить в фокус'}
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

          {/* Bottom Thumbnail Info: Stop Timecode or Status */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            {pin.timecode ? (
              <a
                href={directExternalLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-[#f3e5ab] hover:border-[#f3e5ab]/50 transition-colors mono"
                title="Перейти к таймкоду в браузере"
              >
                <Clock size={11} className="text-[#f3e5ab]" />
                <span>{pin.timecode}</span>
              </a>
            ) : (
              <span />
            )}

            <StatusBadge status={pin.status} />
          </div>

          {/* Episodic Progress Bar */}
          {progressPercent !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#f3e5ab] to-[#ff2a85]"
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
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(243,229,171,0.1)] border border-[rgba(243,229,171,0.2)] text-[10px] text-[#f3e5ab] font-medium">
              <span>🏛️</span>
              <span>{HISTORY_PERIOD_LABELS[pin.historyPeriod]}</span>
            </div>
          )}

          {/* Episodic Tracker controls */}
          {isEpisodic && (
            <div
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Tv size={13} className="text-[#ff2a85]" />
                <span className="mono">
                  Эпизод {currentEp}
                  {totalEp ? ` / ${totalEp}` : ''}
                </span>
                {pin.dubStudio && (
                  <span className="text-[10px] text-white/30 truncate max-w-[80px]">
                    ({pin.dubStudio})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleEpChange(e, -1)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Предыдущая серия"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={(e) => handleEpChange(e, 1)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Следующая серия"
                >
                  +1
                </button>
              </div>
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

      {/* Card Footer Actions */}
      <div
        className="p-3 px-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {pin.rating && (
            <div className="flex items-center gap-1 text-[#f3e5ab] text-xs font-bold mono">
              <Star size={12} fill="currentColor" />
              <span>{pin.rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Скопировать ссылку"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>

          <a
            href={pin.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Открыть оригинал в браузере"
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={() => onDelete(pin.id)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Удалить закреп"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
