/* ───── Platform & Content ───── */
export type Platform = 'youtube' | 'rutube' | 'vk' | 'vimeo' | 'anime' | 'web'
export type ContentType = 'lecture' | 'anime' | 'movie' | 'video' | 'series'
export type Status = 'watching' | 'queued' | 'completed' | 'archived' | 'deleted'
export type StatusFilter = 'all' | 'watching' | 'queued' | 'archive'
export type Category = string

/* ───── Collections / Sections ───── */
export interface Collection {
  id: string
  name: string
  emoji?: string
  color?: string
  isDefault?: boolean
}

export const DEFAULT_COLLECTIONS: Collection[] = []

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

/* ───── Playlist Parts (Multi-part Collections) ───── */
export interface PlaylistPart {
  id: string
  title: string
  url: string
  isCompleted?: boolean
  timecode?: string
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
  parts?: PlaylistPart[]
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
  collections?: Collection[]
  exportedAt: string
  version: string
}
