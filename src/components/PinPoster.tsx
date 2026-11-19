import React, { useState, useEffect } from 'react'
import type { Pin, Platform } from '../types'
import { Tv, Film, Video, Globe, Play, Sparkles } from 'lucide-react'

interface PinPosterProps {
  pin: Pin
  className?: string
  aspectRatio?: string
  imgClassName?: string
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  youtube: <Play size={18} className="text-red-400 fill-current" />,
  rutube: <Video size={18} className="text-blue-400" />,
  vk: <Globe size={18} className="text-sky-400" />,
  vimeo: <Video size={18} className="text-teal-400" />,
  anime: <Tv size={18} className="text-[#ff2a85]" />,
  web: <Film size={18} className="text-[#f3e5ab]" />,
}

export const PinPoster: React.FC<PinPosterProps> = ({
  pin,
  className = '',
  aspectRatio = 'aspect-video',
  imgClassName = 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
}) => {
  const [hasError, setHasError] = useState(false)
  const imageUrl = pin.customThumbnailUrl || pin.thumbnailUrl

  // Reset error if image URL changes
  useEffect(() => {
    setHasError(false)
  }, [imageUrl])

  // Get initial letters or short title for stylized monogram
  const shortTitle = pin.title ? pin.title.slice(0, 32) : 'champagne&pills'
  const firstLetter = pin.title ? pin.title.trim()[0]?.toUpperCase() : '✦'

  if (imageUrl && !hasError) {
    return (
      <div className={`relative w-full overflow-hidden bg-black/60 ${aspectRatio} ${className}`}>
        <img
          src={imageUrl}
          alt={pin.title}
          className={imgClassName}
          loading="lazy"
          onError={() => setHasError(true)}
        />
        {/* Soft bottom gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060609] via-transparent to-black/40 opacity-80 pointer-events-none" />
      </div>
    )
  }

  // Stylish Dark Neon Editorial Fallback (no broken browser image icon!)
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#161a2b] via-[#0d0f19] to-[#07080e] ${aspectRatio} ${className} flex flex-col justify-between p-3.5 select-none border border-white/5`}
    >
      {/* Decorative ambient glowing spot */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-25 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #ff2a85 0%, #f3e5ab 100%)',
        }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #06b6d4 100%)',
        }}
      />

      {/* Top watermark / platform */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
          {PLATFORM_ICONS[pin.platform] || <Sparkles size={16} className="text-[#f3e5ab]" />}
        </div>
        <span
          className="text-[9px] uppercase tracking-widest text-white/30"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {pin.contentType === 'lecture'
            ? 'ЛЕКЦИЯ'
            : pin.contentType === 'anime'
            ? 'АНИМЕ'
            : pin.contentType === 'series'
            ? 'СЕРИАЛ'
            : 'ВИДЕО'}
        </span>
      </div>

      {/* Center Monogram / Typographic Art */}
      <div className="relative z-10 text-center my-auto py-1">
        <div
          className="text-3xl sm:text-4xl font-normal tracking-tight text-white/80 select-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            textShadow: '0 0 20px rgba(243, 229, 171, 0.3)',
          }}
        >
          {firstLetter}
        </div>
        <p className="text-[11px] font-semibold text-white/90 truncate max-w-[200px] mx-auto mt-0.5 px-2">
          {shortTitle}
        </p>
      </div>

      {/* Bottom brand tagline */}
      <div className="relative z-10 flex items-center justify-between text-[9px] text-white/30 pt-1 border-t border-white/5">
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>champagne&amp;pills</span>
        {pin.channelName && <span className="truncate max-w-[100px]">{pin.channelName}</span>}
      </div>
    </div>
  )
}
