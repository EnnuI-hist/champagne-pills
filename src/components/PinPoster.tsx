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

  // Large blurred platform icon for the background artwork
  const renderBackgroundArtwork = () => {
    const iconClass = 'w-24 h-24 sm:w-28 sm:h-28 text-white/[0.06] blur-[1px] transform -rotate-12 select-none pointer-events-none'
    if (pin.platform === 'youtube') return <Play className={`${iconClass} fill-current`} />
    if (pin.platform === 'anime' || pin.contentType === 'anime') return <Tv className={iconClass} />
    if (pin.platform === 'rutube' || pin.platform === 'vimeo') return <Video className={iconClass} />
    if (pin.platform === 'vk') return <Globe className={iconClass} />
    return <Film className={iconClass} />
  }

  // Stylish Nocturnal Editorial Fallback (no broken browser images, no solitary letters C/S!)
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#181a28] via-[#0d0e17] to-[#06070a] ${aspectRatio} ${className} flex flex-col justify-between p-3 sm:p-3.5 select-none border border-white/5`}
    >
      {/* Decorative ambient glowing spots */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #f3e5ab 0%, #ff2a85 100%)',
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #06b6d4 100%)',
        }}
      />

      {/* Large artistic semi-transparent background platform icon */}
      <div className="absolute right-1 bottom-1 sm:right-3 sm:bottom-2 z-0">
        {renderBackgroundArtwork()}
      </div>

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none z-[5]" />

      {/* Top watermark / platform badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
          {PLATFORM_ICONS[pin.platform] || <Sparkles size={12} className="text-[#f3e5ab]" />}
          <span
            className="text-[9px] uppercase tracking-wider text-white/70 font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {pin.platform.toUpperCase()}
          </span>
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

      {/* Bottom-left corner: neat title + channel / timecode with soft vignette */}
      <div className="relative z-10 mt-auto pt-3 text-left">
        <h5 className="text-xs sm:text-sm font-semibold text-white/95 line-clamp-2 leading-snug drop-shadow-md">
          {pin.title}
        </h5>
        <div className="flex items-center justify-between text-[10px] text-white/45 mt-1">
          <span className="truncate max-w-[140px] text-[#f3e5ab]/80 font-medium">
            {pin.channelName || 'champagne&pills'}
          </span>
          {pin.timecode && (
            <span className="mono text-[#f3e5ab] bg-black/60 px-1.5 py-0.2 rounded border border-white/10">
              {pin.timecode}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
