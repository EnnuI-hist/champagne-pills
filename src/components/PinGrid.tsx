import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings2, X, Search } from 'lucide-react'
import type { Pin, Category, StatusFilter, Collection, PlaylistPart } from '../types'
import { PinCard } from './PinCard'

interface PinGridProps {
  pins: Pin[]
  allActivePins: Pin[]
  collections: Collection[]
  category: Category
  onCategoryChange: (cat: Category) => void
  onOpenAddCollection: () => void
  onOpenEditCollection: (col: Collection) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (st: StatusFilter) => void
  selectedTag?: string
  onSelectTag: (tag?: string) => void
  onPlayPin: (pin: Pin) => void
  onTogglePin: (id: string) => void
  onDeletePin: (id: string) => void
  onUpdateEpisode: (id: string, newEp: number) => void
  onUpdateTimecode: (id: string, newTc: string) => void
  onUpdateRating: (id: string, newRating: number) => void
  onTogglePart?: (pinId: string, partId: string) => void
  onPlayPart?: (pin: Pin, part: PlaylistPart) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onOpenAddModal: () => void
}

const STATUS_CONFIG: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'watching', label: '▶ Смотрю' },
  { value: 'queued', label: 'В очереди' },
  { value: 'archive', label: 'Архив' },
]

export const PinGrid: React.FC<PinGridProps> = ({
  pins,
  allActivePins,
  collections,
  category,
  onCategoryChange,
  onOpenAddCollection,
  onOpenEditCollection,
  statusFilter,
  onStatusFilterChange,
  selectedTag,
  onSelectTag,
  onPlayPin,
  onTogglePin,
  onDeletePin,
  onUpdateEpisode,
  onUpdateTimecode,
  onUpdateRating,
  onTogglePart,
  onPlayPart,
  onMoveUp,
  onMoveDown,
  onOpenAddModal,
}) => {
  // Counts per category for the tabs
  const getCategoryCount = (catId: Category): number => {
    if (catId === 'all') return allActivePins.length
    return allActivePins.filter((p) => p.category === catId).length
  }

  // Counts per status
  const getStatusCount = (st: StatusFilter): number => {
    if (st === 'all') return allActivePins.length
    if (st === 'archive') {
      return allActivePins.filter((p) => p.status === 'completed' || p.status === 'archived').length
    }
    return allActivePins.filter((p) => p.status === st).length
  }

  return (
    <div className="space-y-5">
      {/* ── Single Clean Navigation Bar: Left Collections, Right Status Filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Left: Collections Tabs Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none min-w-0">
          {/* Base "Все" Tab */}
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              category === 'all'
                ? 'btn-gold text-[#f3e5ab] shadow-sm'
                : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
            }`}
          >
            <span>Все</span>
            <span
              className="px-1.5 py-0.2 rounded-md text-[10px] mono font-bold"
              style={{
                backgroundColor: category === 'all' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)',
                color: category === 'all' ? '#f3e5ab' : 'rgba(255,255,255,0.4)',
              }}
            >
              {String(getCategoryCount('all')).padStart(2, '0')}
            </span>
          </button>

          {/* User Custom Collections Tabs */}
          {collections.map((col) => {
            const active = category === col.id
            const count = getCategoryCount(col.id)
            return (
              <div
                key={col.id}
                className={`flex items-center rounded-xl transition-all ${
                  active
                    ? 'btn-gold text-[#f3e5ab] shadow-sm'
                    : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onCategoryChange(col.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  {col.emoji && <span>{col.emoji}</span>}
                  <span>{col.name}</span>
                  <span
                    className="px-1.5 py-0.2 rounded-md text-[10px] mono font-bold"
                    style={{
                      backgroundColor: active ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)',
                      color: active ? '#f3e5ab' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {String(count).padStart(2, '0')}
                  </span>
                </button>

                {/* Edit / Configure / Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenEditCollection(col)
                  }}
                  className={`p-1 mr-1 rounded-lg transition-colors cursor-pointer ${
                    active ? 'text-[#f3e5ab]/70 hover:text-[#f3e5ab]' : 'text-white/30 hover:text-white'
                  }`}
                  title="Настроить или удалить раздел"
                >
                  <Settings2 size={11} />
                </button>
              </div>
            )
          })}

          {/* Compact "+" Button */}
          <button
            type="button"
            onClick={onOpenAddCollection}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-white/[0.02] hover:bg-white/5 text-[#f3e5ab]/80 hover:text-[#f3e5ab] border border-dashed border-[#f3e5ab]/30 hover:border-[#f3e5ab]/60 transition-all cursor-pointer"
            title="Создать новый раздел"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Новый раздел</span>
          </button>
        </div>

        {/* Right: Compact Status Filter */}
        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
          {STATUS_CONFIG.map((sf) => {
            const active = statusFilter === sf.value
            const count = getStatusCount(sf.value)
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => onStatusFilterChange(sf.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{sf.label}</span>
                <span className="text-[10px] mono opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tag Filter indicator (if a tag is selected) */}
      {selectedTag && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Фильтр по тегу:</span>
          <button
            type="button"
            onClick={() => onSelectTag(undefined)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff2a85]/20 text-[#ff2a85] border border-[#ff2a85]/30 font-semibold cursor-pointer"
          >
            <span>{selectedTag}</span>
            <X size={11} />
          </button>
        </div>
      )}

      {/* ── Cards Grid (Compact 3-column layout) ── */}
      {pins.length === 0 ? (
        <div className="py-16 text-center space-y-3 glass-card rounded-2xl border border-white/5 p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
            <Search size={24} />
          </div>
          <h3 className="text-base font-semibold text-white/80">В этом разделе пусто</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            {selectedTag || statusFilter !== 'all'
              ? 'Попробуйте сбросить фильтр по статусу или тегу'
              : 'Вставьте ссылку через Ctrl+V или нажмите кнопку «+ Закреп», чтобы добавить первый медиа-файл'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-xl btn-gold text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Plus size={14} /> Создать закреп
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {pins.map((pin, index) => (
              <PinCard
                key={pin.id}
                pin={pin}
                onPlay={onPlayPin}
                onTogglePin={onTogglePin}
                onDelete={onDeletePin}
                onUpdateEpisode={onUpdateEpisode}
                onUpdateTimecode={onUpdateTimecode}
                onUpdateRating={onUpdateRating}
                onTogglePart={onTogglePart}
                onPlayPart={onPlayPart}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                canMoveUp={index > 0}
                canMoveDown={index < pins.length - 1}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
