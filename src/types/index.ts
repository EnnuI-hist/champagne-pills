/* ───── Platform & Content ───── */
export type Platform = 'youtube' | 'rutube' | 'vk' | 'vimeo' | 'anime' | 'web'
export type ContentType = 'lecture' | 'anime' | 'movie' | 'video' | 'series'
export type Status = 'watching' | 'queued' | 'completed' | 'archived' | 'deleted'
export type StatusFilter = 'all' | 'watching' | 'queued' | 'archive'
export type Category = 'all' | 'history' | 'anime' | 'video'

export type HistoryPeriod =
  | 'ancient'
  | 'appanage'
  | 'moscow'
  | 'empire_early'
  | 'empire_late'
  | 'ussr_early'
  | 'ussr_late'
  | 'culture'

export const HISTORY_PERIOD_LABELS: Record<HistoryPeriod, string> = {
  ancient: 'Древняя Русь',
  appanage: 'Удельный период',
  moscow: 'Московское царство',
  empire_early: 'Империя XVIII в.',
  empire_late: 'Империя XIX – нач. XX в.',
  ussr_early: 'СССР: Ленин / Сталин / ВОВ',
  ussr_late: 'Поздний СССР',
  culture: 'Культура и Историография',
}

/* ───── Theme ───── */
export type ThemePreset = 'champagne' | 'cyber' | 'emerald' | 'crimson'
export type NoiseType = 'silent' | 'brown' | 'rain'

export interface ThemeSettings {
  preset: ThemePreset
  customBgDbKey?: string
  dimAmount: number
  blurAmount: number
}

/* ───── Timecode Bookmark ───── */
export interface TimecodeBookmark {
  id: string
  time: string
  label: string
}

/* ───── Pin ───── */
export interface Pin {
  id: string
  title: string
  url: string
  platform: Platform
  contentType: ContentType
  category: Category
  status: Status
  thumbnailUrl?: string
  customThumbnailUrl?: string
  thumbnailDbKey?: string
  note?: string
  notes?: string
  timecode?: string
  timecodeBookmarks?: TimecodeBookmark[]
  lectureNumber?: number
  totalLectures?: number
  // Support both currentEp/totalEp and currentEpisode/totalEpisodes
  currentEp?: number
  totalEp?: number
  currentEpisode?: number
  totalEpisodes?: number
  dubStudio?: string
  rating?: number // 1-10
  tags?: string[]
  historyPeriod?: HistoryPeriod
  channelName?: string
  isPinned: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
  isDeleted?: boolean
  deletedAt?: string
  isDemo?: boolean
}

/* ───── Quick Dock ───── */
export interface QuickLink {
  id: string
  title: string
  url: string
  emoji?: string
}

/* ───── Export Format ───── */
export interface AppData {
  pins: Pin[]
  quickLinks?: QuickLink[]
  exportedAt: string
  version: string
}
