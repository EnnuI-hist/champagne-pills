import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Filter, BookOpen, Settings2, Zap, ArrowRight } from 'lucide-react'
import type { Pin, Category, StatusFilter, HistoryPeriod, Collection, PlaylistPart } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { PinCard } from './PinCard'

interface PinGridProps {
  pins: Pin[]
  allActivePins: Pin[]
  collections: Collection[]
  category: Category
  onCategoryChange: (cat: Category) => void
  onOpenAddCollection: () => void
  onOpenEditCollection: (col: Collection) => void
  onQuickAdd: (url: string, category: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (st: StatusFilter) => void
  historyPeriodFilter?: HistoryPeriod
  onHistoryPeriodFilterChange: (hp?: HistoryPeriod) => void
  search: string
  onSearchChange: (val: string) => void
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
  allTags: string[]
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
  onQuickAdd,
  statusFilter,
  onStatusFilterChange,
  historyPeriodFilter,
  onHistoryPeriodFilterChange,
  search,
  onSearchChange,
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
  allTags,
}) => {
  const [quickUrl, setQuickUrl] = useState('')
  const [isQuickAdding, setIsQuickAdding] = useState(false)

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

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    setIsQuickAdding(true)
    const targetCategory = category === 'all' ? (collections[0]?.id || 'video') : category
    onQuickAdd(quickUrl.trim(), targetCategory)
    setQuickUrl('')
    setTimeout(() => setIsQuickAdding(false), 1200)
  }

  const activeCollection = collections.find((c) => c.id === category)

  return (
    <div className="space-y-6">
      {/* Dynamic Category Tabs with Count Badges & "+ Новый раздел" */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        {/* Category Tabs Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* "Все закрепы" Tab */}
          <button
            type="button"
            onClick={() => {
              onCategoryChange('all')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              category === 'all'
                ? 'btn-gold text-[#f3e5ab] shadow-md'
                : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
            }`}
          >
            <span>Все закрепы</span>
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

          {/* Dynamic Collections Tabs */}
          {collections.map((col) => {
            const active = category === col.id
            const count = getCategoryCount(col.id)
            return (
              <div
                key={col.id}
                className={`flex items-center rounded-xl transition-all ${
                  active
                    ? 'btn-gold text-[#f3e5ab] shadow-md'
                    : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onCategoryChange(col.id)
                    if (col.id !== 'history') {
                      onHistoryPeriodFilterChange(undefined)
                    }
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
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

                {/* Edit / Configure button for custom collection */}
                {!col.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenEditCollection(col)
                    }}
                    className={`p-1.5 mr-1 rounded-lg transition-colors cursor-pointer ${
                      active ? 'text-[#f3e5ab]/70 hover:text-[#f3e5ab]' : 'text-white/30 hover:text-white'
                    }`}
                    title="Настроить или удалить раздел"
                  >
                    <Settings2 size={12} />
                  </button>
                )}
              </div>
            )
          })}

          {/* "+ Новый раздел" button */}
          <button
            type="button"
            onClick={onOpenAddCollection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-white/[0.02] hover:bg-white/5 text-[#f3e5ab]/90 hover:text-[#f3e5ab] border border-dashed border-[#f3e5ab]/30 hover:border-[#f3e5ab]/60 transition-all cursor-pointer"
            title="Создать новый раздел / коллекцию"
          >
            <Plus size={13} />
            <span>+ Новый раздел</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию, автору..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#f3e5ab] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* History Sub-periods Chips (shown for history or all) */}
      {(category === 'history' || category === 'all') && (
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#f3e5ab]">
            <span className="flex items-center gap-1.5 font-semibold">
              <BookOpen size={13} />
              <span>Эпохи истории России (ЕГЭ / Олимп):</span>
            </span>
            {historyPeriodFilter && (
              <button
                type="button"
                onClick={() => onHistoryPeriodFilterChange(undefined)}
                className="text-white/40 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
              >
                <X size={11} /> Сбросить период
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {/* "Все эпохи" chip */}
            <button
              type="button"
              onClick={() => onHistoryPeriodFilterChange(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                !historyPeriodFilter
                  ? 'bg-white/15 text-white border-white/20 font-semibold'
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
              }`}
            >
              Все эпохи
            </button>

            {/* Individual sub-periods */}
            {(Object.keys(HISTORY_PERIOD_LABELS) as HistoryPeriod[]).map((periodKey) => {
              const active = historyPeriodFilter === periodKey
              return (
                <button
                  key={periodKey}
                  type="button"
                  onClick={() =>
                    onHistoryPeriodFilterChange(active ? undefined : periodKey)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-[rgba(243,229,171,0.18)] text-[#f3e5ab] border-[rgba(243,229,171,0.4)] shadow-sm font-semibold'
                      : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {HISTORY_PERIOD_LABELS[periodKey]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Inline Quick-Add Bar (Вставил ссылку -> нажал Enter -> закреп создался) */}
      <form
        onSubmit={handleQuickSubmit}
        className="relative flex items-center gap-2 p-1.5 pl-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 focus-within:border-[#f3e5ab]/50 transition-all"
      >
        <div className="flex items-center gap-2 text-white/40 shrink-0">
          <Zap size={14} className="text-[#f3e5ab]" />
          <span className="text-xs hidden sm:inline text-white/50">Быстрое добавление:</span>
        </div>
        <input
          type="text"
          value={quickUrl}
          onChange={(e) => setQuickUrl(e.target.value)}
          placeholder={
            category === 'all'
              ? 'Вставьте ссылку и нажмите Enter для мгновенного добавления...'
              : `Вставьте ссылку в раздел «${activeCollection?.name || category}» и нажмите Enter...`
          }
          className="flex-1 bg-transparent border-0 text-xs text-white placeholder:text-white/30 focus:outline-none py-1.5"
        />
        <button
          type="submit"
          disabled={!quickUrl.trim()}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            quickUrl.trim()
              ? 'btn-gold text-[#f3e5ab] shadow-md'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {isQuickAdding ? (
            <span className="text-green-400">Добавлено!</span>
          ) : (
            <>
              <span>Добавить</span>
              <ArrowRight size={12} />
            </>
          )}
        </button>
      </form>

      {/* Status Filters & Tag Cloud Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
          <Filter size={12} className="text-white/30 ml-2 mr-1" />
          {STATUS_CONFIG.map((sf) => {
            const active = statusFilter === sf.value
            const count = getStatusCount(sf.value)
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => onStatusFilterChange(sf.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{sf.label}</span>
                <span className="text-[10px] mono opacity-60">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tag Filters Cloud */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {selectedTag && (
              <button
                type="button"
                onClick={() => onSelectTag(undefined)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff2a85]/20 text-[#ff2a85] border border-[#ff2a85]/30 font-semibold cursor-pointer"
              >
                <span>{selectedTag}</span>
                <X size={11} />
              </button>
            )}

            {!selectedTag &&
              allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer text-[11px]"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {pins.length === 0 ? (
        <div className="py-16 text-center space-y-3 glass-card rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
            <Search size={28} />
          </div>
          <h3 className="text-base font-semibold text-white/80">Ничего не найдено</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            {search || historyPeriodFilter || selectedTag || statusFilter !== 'all'
              ? 'Попробуйте изменить поисковый запрос или сбросить активные фильтры'
              : 'В этом разделе пока нет закрепов. Добавьте первый закреп через кнопку или Ctrl+V!'}
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
