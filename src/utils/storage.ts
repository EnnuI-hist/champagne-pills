import type { Pin, AppData, QuickLink } from '../types'
import { uid } from '../utils'

const STORAGE_KEY = 'cp_data'
const LEGACY_KEY = 'pinvault_data'
const DOCK_KEY = 'cp_quickdock'
const VERSION = '2.0.0'

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
    if (raw) return (JSON.parse(raw) as AppData).pins || []
    const legacy = migrateLegacy()
    if (legacy) { savePins(legacy); return legacy }
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
    return [{ id: uid(), title: 'Тренажёр по истории', url: 'https://github.io', emoji: '🏛️' }]
  } catch { return [] }
}

export function saveQuickLinks(links: QuickLink[]): void {
  localStorage.setItem(DOCK_KEY, JSON.stringify(links))
}

/* ───── Export / Import ───── */
export function exportToJson(pins: Pin[], quickLinks: QuickLink[]): void {
  const data: AppData = {
    pins: pins.filter(p => p.status !== 'deleted'),
    quickLinks,
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

export function exportToClipboard(pins: Pin[]): string {
  const data: AppData = {
    pins: pins.filter(p => p.status !== 'deleted'),
    exportedAt: new Date().toISOString(),
    version: VERSION,
  }
  return JSON.stringify(data)
}

export function importFromJson(file: File): Promise<{ pins: Pin[]; quickLinks?: QuickLink[] }> {
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
      id: uid(), title: 'История России с Нуля | Полный курс лекций (ЕГЭ 2025)',
      url: 'https://www.youtube.com/watch?v=8QIcMB-ERPM',
      platform: 'youtube', contentType: 'lecture', category: 'history', status: 'watching',
      thumbnailUrl: 'https://img.youtube.com/vi/8QIcMB-ERPM/hqdefault.jpg',
      note: 'Лекция про Смутное время — ключевая! Михаил Романов 1613 год.',
      notes: '## Смутное время\n- Борис Годунов\n- Лжедмитрий I & II\n- Минин и Пожарский 1612\n- Земский собор 1613 → Михаил Романов',
      timecode: '1:14:30', lectureNumber: 12, totalLectures: 48,
      timecodeBookmarks: [
        { id: uid(), time: '00:18:30', label: 'Причины Смуты' },
        { id: uid(), time: '00:52:10', label: 'Лжедмитрий I' },
        { id: uid(), time: '01:14:30', label: 'Оценки историков' },
      ],
      historyPeriod: 'moscow', tags: ['#лекция', '#олимп'],
      channelName: 'Кодификатор ЕГЭ',
      isPinned: true, createdAt: now, updatedAt: now, isDemo: true,
    },
    {
      id: uid(), title: 'Code Geass: Lelouch of the Rebellion',
      url: 'https://jut.su/code-geass/',
      platform: 'anime', contentType: 'anime', category: 'anime', status: 'watching',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/83/Code_Geass_Lelouch_of_the_Rebellion_R1.png',
      note: 'Озвучка AniDUB. Финал — эпик!',
      currentEpisode: 5, totalEpisodes: 25, dubStudio: 'AniDUB',
      isPinned: true, createdAt: now, updatedAt: now, isDemo: true,
    },
    {
      id: uid(), title: 'Sekiro — видеоэссе о самурайском пути',
      url: 'https://www.youtube.com/watch?v=J2DaIWy_mPQ',
      platform: 'youtube', contentType: 'video', category: 'video', status: 'queued',
      thumbnailUrl: 'https://img.youtube.com/vi/J2DaIWy_mPQ/hqdefault.jpg',
      note: 'Рекомендация из твиттера.',
      channelName: 'Гейм-критик',
      isPinned: false, createdAt: now, updatedAt: now, isDemo: true,
    },
    {
      id: uid(), title: 'Первая мировая война — причины и итоги',
      url: 'https://rutube.ru/video/example123/',
      platform: 'rutube', contentType: 'lecture', category: 'history', status: 'queued',
      note: 'Пересмотреть перед олимпиадой.', historyPeriod: 'empire_late',
      lectureNumber: 3, totalLectures: 10, tags: ['#олимп'],
      isPinned: false, createdAt: now, updatedAt: now, isDemo: true,
    },
  ]
}
