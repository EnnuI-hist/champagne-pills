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
  youtube: <Play size={15} className="text-red-400 fill-current" />,
  rutube: <Video size={15} className="text-blue-400" />,
  vk: <Globe size={15} className="text-sky-400" />,
  vimeo: <Video size={15} className="text-teal-400" />,
  anime: <Tv size={15} className="text-[#ff2a85]" />,
  web: <Film size={15} className="text-[#f3e5ab]" />,
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // YouTube returns a 120x90 gray 3-dots image when a video is deleted or thumbnail is missing
    if (img.naturalWidth === 120 && img.naturalHeight === 90 && pin.platform === 'youtube') {
      setHasError(true)
    }
  }

  // Get initial letters or short title for stylized monogram
  const shortTitle = pin.title ? pin.title.slice(0, 36) : 'champagne&pills'
  const firstLetter = pin.title ? pin.title.trim()[0]?.toUpperCase() : '✦'

  if (imageUrl && !hasError) {
    return (
      <div className={`relative w-full overflow-hidden bg-black/80 ${aspectRatio} ${className}`}>
        <img
          src={imageUrl}
          alt={pin.title}
          className={imgClassName}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={() => setHasError(true)}
        />
        {/* Soft bottom gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060609] via-transparent to-black/30 opacity-70 pointer-events-none" />
      </div>
    )
  }

  // Stylish Dark Nocturnal Editorial Fallback (no broken browser images, no 3 dots!)
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#181a28] via-[#0d0e17] to-[#06070a] ${aspectRatio} ${className} flex flex-col justify-between p-3.5 select-none border border-white/5`}
    >
      {/* Decorative ambient glowing spots */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #ff2a85 0%, #f3e5ab 100%)',
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #06b6d4 100%)',
        }}
      />

      {/* Large artistic semi-transparent background monogram */}
      <div
        className="absolute right-2 bottom-0 text-7xl sm:text-8xl font-serif text-white/[0.06] select-none pointer-events-none font-bold leading-none"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {firstLetter}
      </div>

      {/* Top watermark / platform */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="p-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
          {PLATFORM_ICONS[pin.platform] || <Sparkles size={14} className="text-[#f3e5ab]" />}
        </div>
        <span
          className="text-[9px] uppercase tracking-widest text-white/40 font-semibold"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {pin.parts && pin.parts.length > 0
            ? 'ПЛЕЙЛИСТ'
            : pin.contentType === 'anime'
            ? 'АНИМЕ'
            : pin.contentType === 'series'
            ? 'СЕРИАЛ'
            : pin.contentType === 'lecture'
            ? 'ЛЕКЦИЯ'
            : 'МЕДИА'}
        </span>
      </div>

      {/* Center Monogram / Typographic Art */}
      <div className="relative z-10 my-auto py-1 text-center">
        <div
          className="text-3xl sm:text-4xl font-normal text-white/85 select-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            textShadow: '0 0 20px rgba(243, 229, 171, 0.25)',
          }}
        >
          {firstLetter}
        </div>
        <p className="text-[11px] font-medium text-white/80 truncate max-w-[200px] mx-auto mt-0.5 px-2">
          {shortTitle}
        </p>
      </div>

      {/* Bottom brand watermark */}
      <div className="relative z-10 flex items-center justify-between text-[9px] text-white/30 pt-1 border-t border-white/5">
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>champagne&amp;pills</span>
        {pin.channelName && <span className="truncate max-w-[110px]">{pin.channelName}</span>}
      </div>
    </div>
  )
}
