import React from 'react'
import type { Platform } from '../types'
import { getPlatformLabel } from '../utils'

interface PlatformBadgeProps {
  platform: Platform
}

const badgeClass: Record<Platform, string> = {
  youtube: 'bg-red-500/15 text-red-400 border-red-500/30',
  rutube: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  vk: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  vimeo: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  anime: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  web: 'bg-white/10 text-white/60 border-white/15',
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass[platform]}`}
    style={{ fontFamily: "'JetBrains Mono', monospace" }}
  >
    {getPlatformLabel(platform)}
  </span>
)

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    watching: 'bg-[rgba(243,229,171,0.12)] text-[#f3e5ab] border-[rgba(243,229,171,0.25)]',
    queued: 'bg-[rgba(255,42,133,0.1)] text-[#ff6aaa] border-[rgba(255,42,133,0.2)]',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    archived: 'bg-white/5 text-white/40 border-white/10',
    deleted: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels: Record<string, string> = {
    watching: '▶ Смотрю',
    queued: 'В очереди',
    completed: 'Просмотрено',
    archived: 'Архив',
    deleted: 'В корзине',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        map[status] || map.web
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {labels[status] || status}
    </span>
  )
}
