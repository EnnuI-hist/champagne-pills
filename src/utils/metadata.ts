/** Fetch video metadata from noembed.com / YouTube oEmbed (no API key needed) */
export interface VideoMeta {
  title?: string
  author?: string
  thumbnailUrl?: string
}

export async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  // 1. Try noembed.com (works for YouTube, Vimeo, and many providers)
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.title || data.author_name || data.thumbnail_url) {
        return {
          title: data.title || undefined,
          author: data.author_name || undefined,
          thumbnailUrl: data.thumbnail_url || undefined,
        }
      }
    }
  } catch {
    // CORS or network failure fallback
  }

  // 2. Fallback for YouTube oEmbed
  try {
    if (/youtube\.com|youtu\.be/.test(url)) {
      const ytRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      )
      if (ytRes.ok) {
        const ytData = await ytRes.json()
        return {
          title: ytData.title || undefined,
          author: ytData.author_name || undefined,
          thumbnailUrl: ytData.thumbnail_url || undefined,
        }
      }
    }
  } catch {
    // ignore
  }

  return {}
}

/** For YouTube: get HQ thumbnail directly */
export function youtubeHqThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
