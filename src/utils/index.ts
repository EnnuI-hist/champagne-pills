import type { Pin, Platform, ContentType, Category } from '../types'

/* ───── ID ───── */
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
export const generateId = uid

/* ───── YouTube ───── */
export function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return m?.[1] ?? null
}

/* ───── Platform detection ───── */
export function detectPlatform(url: string): Platform {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const h = new URL(normalized).hostname.toLowerCase()
    if (h.includes('youtube') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('rutube')) return 'rutube'
    if (h.includes('vk.com') || h.includes('vkvideo')) return 'vk'
    if (h.includes('vimeo')) return 'vimeo'
    if (/animego|anidub|anilibria|shikimori|jut\.su|animevost|sovetromantica/.test(h))
      return 'anime'
    return 'web'
  } catch { return 'web' }
}

export function inferContentType(p: Platform): ContentType {
  if (p === 'anime') return 'anime'
  return 'video'
}

export function guessCategory(url: string, ct: ContentType): Category {
  if (detectPlatform(url) === 'anime' || ct === 'anime' || ct === 'series' || ct === 'movie') return 'anime'
  if (ct === 'lecture') return 'lectures'
  return 'video'
}

/* ───── Thumbnail helpers ───── */
export function getThumbnailUrl(pin: Pin): string {
  return pin.customThumbnailUrl || pin.thumbnailUrl || ''
}

/* ───── Timecode math ───── */
export function timecodeToSeconds(tc: string): number {
  const parts = tc.trim().split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

export function secondsToTimecode(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export function buildYouTubeTimecodeUrl(url: string, timecode: string): string {
  const videoId = extractYouTubeId(url)
  const s = timecodeToSeconds(timecode)
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}&t=${s}s`
  return `${url}${url.includes('?') ? '&' : '?'}t=${s}s`
}

/* ───── Labels ───── */
const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube', rutube: 'Rutube', vk: 'VK Видео',
  vimeo: 'Vimeo', anime: 'Аниме', web: 'Веб',
}
export const getPlatformLabel = (p: Platform) => PLATFORM_LABELS[p]

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: '#ff4444', rutube: '#00aaff', vk: '#4a76a8',
  vimeo: '#1ab7ea', anime: '#d946ef', web: '#6b7280',
}
export const getPlatformColor = (p: Platform) => PLATFORM_COLORS[p]

export const STATUS_LABELS: Record<string, string> = {
  watching: '▶ Смотрю', queued: 'В очереди',
  completed: 'Просмотрено', archived: 'Архив', deleted: 'Удалено',
}

export const getCategoryLabel = (c: Category) => (c === 'all' ? 'Все' : c)

export function isUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}
