// YouTube IFrame Player API utilities
// Loaded once globally; components instantiate and interact with YT.Player

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        opts: YTPlayerOptions,
      ) => YTPlayer
      PlayerState: {
        UNSTARTED: number
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export interface YTPlayerOptions {
  videoId?: string
  width?: number | string
  height?: number | string
  playerVars?: {
    autoplay?: 0 | 1
    start?: number
    rel?: 0 | 1
    modestbranding?: 0 | 1
    enablejsapi?: 0 | 1
    origin?: string
    controls?: 0 | 1
    playsinline?: 0 | 1
  }
  events?: {
    onReady?: (event: YTPlayerEvent) => void
    onStateChange?: (event: YTPlayerStateEvent) => void
    onError?: (event: YTPlayerEvent) => void
  }
}

export interface YTPlayer {
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  destroy(): void
  loadVideoById(videoId: string, startSeconds?: number): void
  cueVideoById(videoId: string, startSeconds?: number): void
}

export interface YTPlayerEvent {
  target: YTPlayer
}

export interface YTPlayerStateEvent {
  target: YTPlayer
  data: number
}

// ─── Load YT script once (idempotent & resilient) ───────────────────────────

let _apiLoaded = false
const _apiReadyCallbacks: (() => void)[] = []

export function loadYouTubeIframeAPI(): void {
  if (typeof window === 'undefined') return
  if (window.YT?.Player) return
  if (_apiLoaded || document.getElementById('yt-iframe-api')) return

  _apiLoaded = true

  const existingReady = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    if (typeof existingReady === 'function') {
      try { existingReady() } catch { /* ignore */ }
    }
    while (_apiReadyCallbacks.length > 0) {
      const cb = _apiReadyCallbacks.shift()
      cb?.()
    }
  }

  const tag = document.createElement('script')
  tag.id = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  tag.async = true
  document.head.appendChild(tag)
}

/** Returns a promise that resolves when YT.Player is available */
export function whenYTReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window !== 'undefined' && window.YT?.Player) {
      resolve()
      return
    }
    _apiReadyCallbacks.push(resolve)
    loadYouTubeIframeAPI()

    // Polling safety fallback in case callback doesn't fire
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.YT?.Player) {
        clearInterval(interval)
        resolve()
      }
    }, 150)

    // Clear interval after 10s to avoid leak
    setTimeout(() => clearInterval(interval), 10000)
  })
}

// ─── Timecode formatting ────────────────────────────────────────────────────

export function formatTimecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

// ─── Playlist ID extraction ──────────────────────────────────────────────────

export function extractPlaylistId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const list = u.searchParams.get('list')
    if (list && /^[A-Za-z0-9_-]+$/.test(list)) {
      return list
    }
  } catch {
    // fallback regex
  }
  const m = url.match(/[?&]list=([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

// ─── Playlist Metadata (Title, Author, Thumbnail) ───────────────────────────

export interface PlaylistMeta {
  title?: string
  author?: string
  thumbnail?: string
}

export async function fetchPlaylistMetadata(playlistId: string): Promise<PlaylistMeta> {
  const result: PlaylistMeta = {}

  // 1. Official YouTube oEmbed endpoint (very fast, reliable)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${encodeURIComponent(
      playlistId,
    )}&format=json`
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(3500) })
    if (res.ok) {
      const data = await res.json()
      if (data?.title) result.title = data.title
      if (data?.author_name) result.author = data.author_name
      if (data?.thumbnail_url) result.thumbnail = data.thumbnail_url
      if (result.title) return result
    }
  } catch {
    // Continue to fallback
  }

  // 2. Noembed fallback
  try {
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${encodeURIComponent(
      playlistId,
    )}`
    const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(3500) })
    if (res.ok) {
      const data = await res.json()
      if (data?.title && !result.title) result.title = data.title
      if (data?.author_name && !result.author) result.author = data.author_name
      if (data?.thumbnail_url && !result.thumbnail) result.thumbnail = data.thumbnail_url
    }
  } catch {
    // Graceful fallback
  }

  return result
}

// ─── Playlist RSS fetch via CORS proxies ─────────────────────────────────────

export interface PlaylistVideo {
  id: string
  title: string
  url: string
  thumbnail?: string
}

export interface PlaylistFeedResult {
  success: boolean
  title?: string
  author?: string
  thumbnail?: string
  videos: PlaylistVideo[]
  error?: string
}

/**
 * Loads YouTube playlist metadata & video list from official RSS feed:
 * https://www.youtube.com/feeds/videos.xml?playlist_id=...
 * Uses multiple CORS proxies in sequence with quick timeouts.
 * Never blocks playlist saving if proxies are unavailable.
 */
export async function fetchYoutubePlaylist(playlistId: string): Promise<PlaylistFeedResult> {
  // Concurrently fetch metadata for fastest title & thumbnail display
  const metaPromise = fetchPlaylistMetadata(playlistId)

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`

  // Sequential proxy candidates
  const proxyEndpoints: ((url: string) => string)[] = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  ]

  let xmlText = ''

  for (const buildProxyUrl of proxyEndpoints) {
    try {
      const proxyUrl = buildProxyUrl(feedUrl)
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) continue

      if (proxyUrl.includes('/get?url=')) {
        const json = await res.json()
        const content = json?.contents
        if (typeof content === 'string' && (content.includes('<feed') || content.includes('<entry'))) {
          xmlText = content
          break
        }
      } else {
        const text = await res.text()
        if (typeof text === 'string' && (text.includes('<feed') || text.includes('<entry'))) {
          xmlText = text
          break
        }
      }
    } catch {
      // Try next proxy candidate
    }
  }

  const meta = await metaPromise
  let playlistTitle = meta.title || ''
  let authorName = meta.author || ''
  let playlistThumb = meta.thumbnail || ''
  const videos: PlaylistVideo[] = []

  if (xmlText) {
    // 1. DOMParser
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlText, 'application/xml')

      if (!playlistTitle) {
        playlistTitle = doc.querySelector('feed > title')?.textContent?.trim() || ''
      }
      if (!authorName) {
        authorName = doc.querySelector('feed > author > name')?.textContent?.trim() || ''
      }

      const entries = Array.from(doc.querySelectorAll('entry'))
      for (const entry of entries) {
        const videoId =
          entry.getElementsByTagName('yt:videoId')[0]?.textContent?.trim() ||
          entry.querySelector('videoId')?.textContent?.trim() ||
          entry.querySelector('[name="videoId"]')?.getAttribute('content')?.trim() ||
          ''

        const title =
          entry.getElementsByTagName('title')[0]?.textContent?.trim() ||
          (videoId ? `Видео ${videoId}` : '')

        if (videoId) {
          videos.push({
            id: videoId,
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          })
        }
      }
    } catch {
      // Ignore and proceed to regex fallback
    }

    // 2. Regex fallback for namespace quirks
    if (videos.length === 0) {
      const entryRegex = /<entry[\s\S]*?<\/entry>/gi
      const entryMatches = xmlText.match(entryRegex) || []

      if (!playlistTitle) {
        const titleMatch = xmlText.match(/<feed[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) playlistTitle = titleMatch[1].trim()
      }

      for (const entryStr of entryMatches) {
        const idMatch =
          entryStr.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i) ||
          entryStr.match(/<videoId>([^<]+)<\/videoId>/i)
        const tMatch = entryStr.match(/<title[^>]*>([^<]+)<\/title>/i)

        const vId = idMatch ? idMatch[1].trim() : ''
        const vTitle = tMatch ? tMatch[1].trim() : (vId ? `Видео ${vId}` : '')

        if (vId) {
          videos.push({
            id: vId,
            title: vTitle,
            url: `https://www.youtube.com/watch?v=${vId}`,
            thumbnail: `https://img.youtube.com/vi/${vId}/mqdefault.jpg`,
          })
        }
      }
    }
  }

  if (!playlistThumb && videos.length > 0 && videos[0].thumbnail) {
    playlistThumb = videos[0].thumbnail
  }

  if (videos.length === 0) {
    return {
      success: false,
      title: playlistTitle || undefined,
      author: authorName || undefined,
      thumbnail: playlistThumb || undefined,
      videos: [],
      error: 'Прокси временно недоступны или плейлист закрытый. Сохраните плейлист или вставьте список ссылок вручную.',
    }
  }

  return {
    success: true,
    title: playlistTitle || undefined,
    author: authorName || undefined,
    thumbnail: playlistThumb || undefined,
    videos,
  }
}

// Backward-compatible alias
export const fetchPlaylistVideos = fetchYoutubePlaylist
