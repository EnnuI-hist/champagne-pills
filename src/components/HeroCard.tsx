import React from 'react'
import { Play, Clock, Sparkles, ExternalLink, Tv, BookOpen } from 'lucide-react'
import type { Pin } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { buildYouTubeTimecodeUrl } from '../utils'
import { PlatformBadge } from './Badges'

interface HeroCardProps {
  pin: Pin
  onPlay: (pin: Pin) => void
}

export const HeroCard: React.FC<HeroCardProps> = ({ pin, onPlay }) => {
  const isEpisodic = pin.contentType === 'anime' || pin.contentType === 'series'
  const currentEp = pin.currentEpisode ?? pin.currentEp ?? 1
  const totalEp = pin.totalEpisodes ?? pin.totalEp

  const directExternalLink =
    pin.platform === 'youtube' && pin.timecode
      ? buildYouTubeTimecodeUrl(pin.url, pin.timecode)
      : pin.url

  return (
    <div className="relative rounded-3xl overflow-hidden glass-card border border-white/10 group mb-8 shadow-2xl">
      {/* Background Poster with heavy blur and gradient blend */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {pin.thumbnailUrl || pin.customThumbnailUrl ? (
          <img
            src={pin.customThumbnailUrl || pin.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover scale-110 blur-xl opacity-25 transition-transform duration-700 group-hover:scale-125"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060609] via-[#060609]/90 to-transparent" />
      </div>

      {/* Ambilight Accent Glow */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #ff2a85 0%, #f3e5ab 100%)',
        }}
      />

      {/* Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        {/* Left Column: Info & Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(243,229,171,0.12)] border border-[rgba(243,229,171,0.25)] text-[#f3e5ab] text-xs font-semibold">
              <Sparkles size={13} className="text-[#ff2a85]" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                СЕЙЧАС В ФОКУСЕ
              </span>
            </div>
            <PlatformBadge platform={pin.platform} />
            {pin.historyPeriod && (
              <span className="text-xs text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                🏛️ {HISTORY_PERIOD_LABELS[pin.historyPeriod]}
              </span>
            )}
          </div>

          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/95 leading-tight tracking-tight line-clamp-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {pin.title}
          </h2>

          {pin.channelName && (
            <p className="text-sm text-white/50 font-medium">
              Канал: <span className="text-white/80">{pin.channelName}</span>
            </p>
          )}

          {/* Episode / Lecture / Timecode Summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/70 pt-1">
            {isEpisodic && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 mono">
                <Tv size={14} className="text-[#ff2a85]" />
                <span className="font-semibold text-white">
                  Серия {currentEp}
                  {totalEp ? ` из ${totalEp}` : ''}
                </span>
                {pin.dubStudio && <span className="text-white/40">({pin.dubStudio})</span>}
              </div>
            )}

            {pin.lectureNumber && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 mono">
                <BookOpen size={14} className="text-[#f3e5ab]" />
                <span className="font-semibold text-white">
                  Лекция {pin.lectureNumber}
                  {pin.totalLectures ? ` из ${pin.totalLectures}` : ''}
                </span>
              </div>
            )}

            {pin.timecode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 mono text-[#f3e5ab]">
                <Clock size={14} />
                <span>Остановка: {pin.timecode}</span>
              </div>
            )}
          </div>

          {/* Quick Note preview */}
          {(pin.note || pin.notes) && (
            <p className="text-xs text-white/50 italic line-clamp-2 max-w-xl leading-relaxed pt-1">
              «{pin.note || pin.notes}»
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => onPlay(pin)}
              className="px-6 py-3 rounded-2xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer transition-transform hover:scale-105"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Play size={15} className="fill-current text-[#0b0d11]" />
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
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink size={14} />
              <span>В браузере</span>
            </a>
          </div>
        </div>

        {/* Right Column: Hero Visual Frame */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            onClick={() => onPlay(pin)}
            className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black cursor-pointer group/poster"
          >
            {pin.thumbnailUrl || pin.customThumbnailUrl ? (
              <img
                src={pin.customThumbnailUrl || pin.thumbnailUrl}
                alt={pin.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <Play size={36} />
              </div>
            )}

            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
              <div className="p-4 rounded-2xl btn-gold shadow-2xl">
                <Play size={24} className="fill-current text-[#0b0d11]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
