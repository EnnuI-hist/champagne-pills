import React from 'react'
import { Play, Clock, Sparkles, ExternalLink, Tv, BookOpen, PinOff } from 'lucide-react'
import type { Pin } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge } from './Badges'

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
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[rgba(243,229,171,0.15)] text-[#f3e5ab]">
            <Sparkles size={14} className="text-[#ff2a85]" />
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
        className={`grid gap-4 ${
          displayPins.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
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
              className="relative rounded-3xl overflow-hidden glass-card border border-white/10 group shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col justify-between"
            >
              {/* Background Poster with heavy blur and gradient blend */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {pin.thumbnailUrl || pin.customThumbnailUrl ? (
                  <img
                    src={pin.customThumbnailUrl || pin.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover scale-110 blur-2xl opacity-25 transition-transform duration-700 group-hover:scale-125"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-[#060609] via-[#060609]/90 to-black/60" />
              </div>

              {/* Ambient Accent Glow */}
              <div
                className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #ff2a85 0%, #f3e5ab 100%)',
                }}
              />

              {/* Card Body */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between gap-5 flex-1">
                {/* Top Row: Badges & Unpin action */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={pin.platform} />
                    {pin.historyPeriod && (
                      <span className="text-[11px] text-[#f3e5ab] bg-[rgba(243,229,171,0.1)] border border-[rgba(243,229,171,0.2)] px-2.5 py-0.5 rounded-full font-medium">
                        🏛️ {HISTORY_PERIOD_LABELS[pin.historyPeriod]}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onTogglePin(pin.id)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Убрать из фокуса"
                  >
                    <PinOff size={14} />
                  </button>
                </div>

                {/* Main Middle Row: Title, Notes & Poster */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-7 space-y-2.5">
                    <h3
                      className="text-lg sm:text-xl font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-[#f3e5ab] transition-colors"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {pin.title}
                    </h3>

                    {pin.channelName && (
                      <p className="text-xs text-white/40 font-medium truncate">
                        {pin.channelName}
                      </p>
                    )}

                    {/* Meta Trackers */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 pt-0.5">
                      {isEpisodic && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 mono">
                          <Tv size={13} className="text-[#ff2a85]" />
                          <span className="font-semibold text-white">
                            Серия {currentEp}
                            {totalEp ? ` / ${totalEp}` : ''}
                          </span>
                          {pin.dubStudio && (
                            <span className="text-white/40 text-[10px]">({pin.dubStudio})</span>
                          )}
                        </div>
                      )}

                      {pin.lectureNumber && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 mono">
                          <BookOpen size={13} className="text-[#f3e5ab]" />
                          <span className="font-semibold text-white">
                            Лекция {pin.lectureNumber}
                            {pin.totalLectures ? ` из ${pin.totalLectures}` : ''}
                          </span>
                        </div>
                      )}

                      {pin.timecode && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 mono text-[#f3e5ab]">
                          <Clock size={13} />
                          <span>{pin.timecode}</span>
                        </div>
                      )}
                    </div>

                    {/* Note quote */}
                    {(pin.note || pin.notes) && (
                      <p className="text-[11px] text-white/50 italic line-clamp-2 leading-relaxed">
                        «{pin.note || pin.notes}»
                      </p>
                    )}
                  </div>

                  {/* Thumbnail Preview with Play Icon */}
                  <div
                    onClick={() => onPlay(pin)}
                    className="sm:col-span-5 relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black cursor-pointer group/poster shadow-xl"
                  >
                    {pin.thumbnailUrl || pin.customThumbnailUrl ? (
                      <img
                        src={pin.customThumbnailUrl || pin.thumbnailUrl}
                        alt={pin.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <Play size={28} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
                      <div className="p-3 rounded-xl btn-gold shadow-2xl scale-90 group-hover/poster:scale-100 transition-transform">
                        <Play size={18} className="fill-current text-[#0b0d11]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Big Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => onPlay(pin)}
                    className="flex-1 py-2.5 px-4 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform hover:scale-[1.02]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <Play size={14} className="fill-current text-[#0b0d11]" />
                    <span>
                      {pin.timecode
                        ? `Продолжить с ${pin.timecode}`
                        : isEpisodic
                        ? `Смотреть ${currentEp} серию`
                        : 'Продолжить просмотр'}
                    </span>
                  </button>

                  <a
                    href={directExternalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Открыть сразу в браузере с нужного таймкода"
                  >
                    <ExternalLink size={13} />
                    <span className="hidden sm:inline">В браузере</span>
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
