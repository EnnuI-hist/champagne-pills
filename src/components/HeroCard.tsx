import React from 'react'
import { Play, Clock, Sparkles, ExternalLink, Tv, BookOpen, PinOff } from 'lucide-react'
import type { Pin } from '../types'
import { buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge } from './Badges'
import { PinPoster } from './PinPoster'

interface HeroSectionProps {
  pins: Pin[]
  onPlay: (pin: Pin) => void
  onTogglePin: (id: string) => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ pins, onPlay, onTogglePin }) => {
  if (pins.length === 0) return null

  // Display up to 2 pinned cards
  const displayPins = pins.slice(0, 2)

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[rgba(243,229,171,0.15)] text-[#f3e5ab]">
            <Sparkles size={13} className="text-[#ff2a85]" />
          </div>
          <h2
            className="text-xs font-bold uppercase tracking-wider text-[#f3e5ab]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Сейчас в фокусе ({displayPins.length})
          </h2>
        </div>
        <span
          className="text-[11px] text-white/30 hidden sm:inline"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Мгновенный запуск с места остановки
        </span>
      </div>

      <div
        className={`grid gap-5 ${
          displayPins.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {displayPins.map((pin) => {
          const isEpisodic = pin.contentType === 'anime' || pin.contentType === 'series'
          const currentEp = pin.currentEpisode ?? pin.currentEp ?? 1
          const totalEp = pin.totalEpisodes ?? pin.totalEp

          const directExternalLink =
            pin.platform === 'youtube' && pin.timecode
              ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
              : pin.url

          return (
            <div
              key={pin.id}
              className="relative rounded-2xl overflow-hidden glass-card border border-white/10 group shadow-xl hover:border-white/20 transition-all flex flex-col sm:flex-row min-h-[180px]"
            >
              {/* Left Side: Poster fills entire left half seamlessly without gaps */}
              <div
                onClick={() => onPlay(pin)}
                className="relative w-full sm:w-1/2 min-h-[160px] sm:min-h-full bg-black/80 shrink-0 cursor-pointer overflow-hidden group/poster"
              >
                <PinPoster
                  pin={pin}
                  aspectRatio="aspect-auto"
                  className="w-full h-full min-h-[160px] sm:min-h-full"
                />

                {/* Platform Badge on top-left of poster */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <PlatformBadge platform={pin.platform} />
                </div>

                {/* Quick Play Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
                  <div className="p-3 rounded-xl btn-gold shadow-2xl scale-90 group-hover/poster:scale-100 transition-transform">
                    <Play size={18} className="fill-current text-[#0b0d11]" />
                  </div>
                </div>
              </div>

              {/* Right Side: Title, Progress, Note, and Actions */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3 min-w-0">
                {/* Header: ContentType tag & Unpin button */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-[#f3e5ab] font-bold border border-white/10 mono truncate">
                    {pin.contentType === 'anime'
                      ? 'Аниме'
                      : pin.contentType === 'series'
                      ? 'Сериал'
                      : pin.contentType === 'lecture'
                      ? 'Лекция'
                      : 'В фокусе'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onTogglePin(pin.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Убрать из фокуса"
                  >
                    <PinOff size={13} />
                  </button>
                </div>

                {/* Content: Title, Channel, Progress, Note */}
                <div className="space-y-1.5 min-w-0">
                  <h3
                    onClick={() => onPlay(pin)}
                    className="text-sm sm:text-base font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-[#f3e5ab] transition-colors cursor-pointer"
                  >
                    {pin.title}
                  </h3>

                  {pin.channelName && (
                    <p className="text-[11px] text-white/40 truncate font-medium">
                      {pin.channelName}
                    </p>
                  )}

                  {/* Progress: Episode or Timecode */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {isEpisodic && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#ff2a85] font-semibold mono">
                        <Tv size={12} />
                        <span>
                          Серия {currentEp}
                          {totalEp ? ` / ${totalEp}` : ''}
                        </span>
                      </span>
                    )}

                    {pin.timecode && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#f3e5ab] font-semibold mono">
                        <Clock size={12} />
                        <span>{pin.timecode}</span>
                      </span>
                    )}

                    {pin.lectureNumber && (
                      <span className="inline-flex items-center gap-1 text-xs text-white/60 mono">
                        <BookOpen size={12} className="text-[#f3e5ab]" />
                        <span>Лекция {pin.lectureNumber}</span>
                      </span>
                    )}
                  </div>

                  {/* Note preview if any */}
                  {(pin.note || pin.notes) && (
                    <p className="text-[11px] text-white/50 italic line-clamp-1 leading-relaxed">
                      «{pin.note || pin.notes}»
                    </p>
                  )}
                </div>

                {/* Bottom Row: Play Button & Direct Browser Link */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => onPlay(pin)}
                    className="flex-1 py-2 px-3 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <Play size={13} className="fill-current text-[#0b0d11]" />
                    <span className="truncate">
                      {pin.timecode
                        ? `С ${pin.timecode}`
                        : isEpisodic
                        ? `Серия ${currentEp}`
                        : 'Смотреть'}
                    </span>
                  </button>

                  <a
                    href={directExternalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 text-xs transition-colors shrink-0"
                    title="В браузере"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
