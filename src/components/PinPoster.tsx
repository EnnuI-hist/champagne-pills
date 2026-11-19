import React, { useState, useEffect } from 'react'
import type { Pin, Platform } from '../types'
import { Tv, Film, Video, Globe, Play, Sparkles } from 'lucide-react'
import { extractYouTubeId } from '../utils'

interface PinPosterProps {
  pin: Pin
  className?: string
  aspectRatio?: string
  imgClassName?: string
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  youtube: <Play size={13} className="text-red-400 fill-current" />,
  rutube: <Video size={13} className="text-blue-400" />,
  vk: <Globe size={13} className="text-sky-400" />,
  vimeo: <Video size={13} className="text-teal-400" />,
  anime: <Tv size={13} className="text-[#ff2a85]" />,
  web: <Film size={13} className="text-[#f3e5ab]" />,
}

export const PinPoster: React.FC<PinPosterProps> = ({
  pin,
  className = '',
  aspectRatio = 'aspect-video',
  imgClassName = 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
}) => {
  const [hasError, setHasError] = useState(false)

  // Auto-resolve YouTube preview if thumbnail not provided or is generic
  const ytId = extractYouTubeId(pin.url)
  const defaultYtThumb = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : ''
  const imageUrl = pin.customThumbnailUrl || pin.thumbnailUrl || defaultYtThumb

  // Reset error when target image URL changes
  useEffect(() => {
    setHasError(false)
  }, [imageUrl])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // YouTube returns a 120x90 gray 3-dots image when a video is deleted or thumbnail is missing
    if (img.naturalWidth === 120 && img.naturalHeight === 90 && (pin.platform === 'youtube' || Boolean(ytId))) {
      setHasError(true)
    }
  }

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
        {/* Soft bottom vignette overlay for text and badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-70 pointer-events-none" />
      </div>
    )
  }

  // Large center platform icon with soft ambient glow
  const renderCenterPlatformIcon = () => {
    const size = 36
    if (pin.platform === 'youtube') return <Play size={size} className="fill-current text-red-400/80 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
    if (pin.platform === 'anime' || pin.contentType === 'anime') return <Tv size={size} className="text-[#ff2a85]/80 drop-shadow-[0_0_12px_rgba(255,42,133,0.5)]" />
    if (pin.platform === 'rutube') return <Video size={size} className="text-blue-400/80 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]" />
    if (pin.platform === 'vimeo') return <Video size={size} className="text-teal-400/80 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)]" />
    if (pin.platform === 'vk') return <Globe size={size} className="text-sky-400/80 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
    return <Film size={size} className="text-[#f3e5ab]/80 drop-shadow-[0_0_12px_rgba(243,229,171,0.5)]" />
  }

  // Stylish Nocturnal Minimalist Fallback: Ambient neon gradient + center icon + corner badges (No duplicated text!)
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#181a28] via-[#0d0e17] to-[#06070a] ${aspectRatio} ${className} flex items-center justify-center select-none border border-white/5`}
    >
      {/* Decorative ambient glowing spots */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #f3e5ab 0%, #ff2a85 100%)',
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #06b6d4 100%)',
        }}
      />

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none z-[5]" />

      {/* Top-left platform watermark */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
        {PLATFORM_ICONS[pin.platform] || <Sparkles size={12} className="text-[#f3e5ab]" />}
        <span
          className="text-[9px] uppercase tracking-wider text-white/70 font-semibold"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {pin.platform.toUpperCase()}
        </span>
      </div>

      {/* Top-right status / media badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span
          className="text-[9px] uppercase tracking-widest text-white/45 font-semibold px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md"
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
            : 'ВИДЕО'}
        </span>
      </div>

      {/* Center: Large Stylish Semi-transparent Platform Emblem */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.6)] group-hover:scale-105 group-hover:border-[#f3e5ab]/30 transition-all duration-300">
          {renderCenterPlatformIcon()}
        </div>
      </div>
    </div>
  )
}
