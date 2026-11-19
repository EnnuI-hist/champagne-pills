import type { Pin, AppData, QuickLink, Collection } from '../types'
import { DEFAULT_COLLECTIONS } from '../types'
import { uid } from '../utils'

const STORAGE_KEY = 'cp_data'
const LEGACY_KEY = 'pinvault_data'
const DOCK_KEY = 'cp_quickdock'
const COLLECTIONS_KEY = 'cp_collections'
const VERSION = '2.1.0'

/* ───── Migration ───── */
function migrateLegacy(): Pin[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    const pins = (d.pins || d) as Pin[]
    return Array.isArray(pins) && pins.length > 0 ? pins : null
  } catch { return null }
}

/* ───── Pins ───── */
export function loadPins(): Pin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const pins = ((JSON.parse(raw) as AppData).pins || []) as Pin[]
      return pins
        .filter(
          (p) => !/егэ|олимп|смутное|история россии с нуля/i.test(p.title) && p.category !== 'history'
        )
        .map((p) => (p.thumbnailUrl?.includes('J2DaIWy_mPQ') ? { ...p, thumbnailUrl: undefined } : p))
    }
    const legacy = migrateLegacy()
    if (legacy) {
      const cleaned = legacy
        .filter(
          (p) => !/егэ|олимп|смутное|история россии с нуля/i.test(p.title) && p.category !== 'history'
        )
        .map((p) => (p.thumbnailUrl?.includes('J2DaIWy_mPQ') ? { ...p, thumbnailUrl: undefined } : p))
      savePins(cleaned)
      return cleaned
    }
    return []
  } catch { return [] }
}

export function savePins(pins: Pin[]): void {
  const data: AppData = { pins, exportedAt: new Date().toISOString(), version: VERSION }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/* ───── Quick Dock ───── */
export function loadQuickLinks(): QuickLink[] {
  try {
    const raw = localStorage.getItem(DOCK_KEY)
    if (raw) return JSON.parse(raw) as QuickLink[]
    return [{ id: uid(), title: 'YouTube', url: 'https://youtube.com', emoji: '▶️' }]
  } catch { return [] }
}

export function saveQuickLinks(links: QuickLink[]): void {
  localStorage.setItem(DOCK_KEY, JSON.stringify(links))
}

/* ───── Collections / Sections ───── */
export function loadCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Collection[]
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (c) =>
            c.id !== 'history' &&
            c.name !== 'История (ЕГЭ / Олимп)' &&
            c.name !== 'Аниме и Сериалы' &&
            c.name !== 'Видео / Эссе' &&
            !/егэ|олимп|истори/i.test(c.name)
        )
      }
    }
    return DEFAULT_COLLECTIONS
  } catch {
    return DEFAULT_COLLECTIONS
  }
}

export function saveCollections(collections: Collection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
}

/* ───── Export / Import ───── */
export function exportToJson(pins: Pin[], quickLinks: QuickLink[], collections?: Collection[]): void {
  const data: AppData = {
    pins: pins.filter(p => p.status !== 'deleted'),
    quickLinks,
    collections,
    exportedAt: new Date().toISOString(),
    version: VERSION,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `champagne-pills-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function exportToClipboard(pins: Pin[], collections?: Collection[]): string {
  const data: AppData = {
    pins: pins.filter(p => p.status !== 'deleted'),
    collections,
    exportedAt: new Date().toISOString(),
    version: VERSION,
  }
  return JSON.stringify(data)
}

export function importFromJson(file: File): Promise<{ pins: Pin[]; quickLinks?: QuickLink[]; collections?: Collection[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const pins = (data.pins ?? data) as Pin[]
        if (!Array.isArray(pins)) throw new Error('Invalid format')
        resolve({
          pins: pins.map(p => ({ ...p, id: p.id || uid() })),
          quickLinks: data.quickLinks,
          collections: data.collections,
        })
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Read error'))
    reader.readAsText(file)
  })
}

/* ───── Demo data ───── */
export function getDemoData(): Pin[] {
  const now = new Date().toISOString()
  return [
    {
      id: uid(),
      title: 'Code Geass: Lelouch of the Rebellion',
      url: 'https://jut.su/code-geass/',
      platform: 'anime',
      contentType: 'anime',
      category: 'anime',
      status: 'watching',
      note: 'Озвучка AniDUB. Финал — шедевр!',
      currentEpisode: 5,
      totalEpisodes: 25,
      dubStudio: 'AniDUB',
      isPinned: true,
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    },
    {
      id: uid(),
      title: 'Sekiro — видеоэссе о самурайском пути',
      url: 'https://www.youtube.com/watch?v=J2DaIWy_mPQ',
      platform: 'youtube',
      contentType: 'video',
      category: 'video',
      status: 'queued',
      note: 'Рекомендация для вечернего просмотра.',
      channelName: 'Гейм-критик',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    },
  ]
}
