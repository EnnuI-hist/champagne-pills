import React from 'react'
import { Search, X, Plus, Filter, BookOpen } from 'lucide-react'
import type { Pin, Category, Status, HistoryPeriod } from '../types'
import { HISTORY_PERIOD_LABELS } from '../types'
import { PinCard } from './PinCard'

interface PinGridProps {
  pins: Pin[]
  category: Category
  onCategoryChange: (cat: Category) => void
  statusFilter: Status | 'all'
  onStatusFilterChange: (st: Status | 'all') => void
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
  onOpenAddModal: () => void
  allTags: string[]
}

const CATEGORY_TABS: { value: Category; label: string; countKey?: Category }[] = [
  { value: 'all', label: 'Все закрепы' },
  { value: 'history', label: 'История (ЕГЭ / Олимп)' },
  { value: 'anime', label: 'Аниме & Сериалы' },
  { value: 'video', label: 'Видео & Лекции' },
]

const STATUS_FILTERS: { value: Status | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'watching', label: '▶ Смотрю' },
  { value: 'queued', label: 'В очереди' },
  { value: 'completed', label: 'Просмотрено' },
]

export const PinGrid: React.FC<PinGridProps> = ({
  pins,
  category,
  onCategoryChange,
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
  onOpenAddModal,
  allTags,
}) => {
  return (
    <div className="space-y-6">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  onCategoryChange(tab.value)
                  if (tab.value !== 'history') onHistoryPeriodFilterChange(undefined)
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'btn-gold text-[#f3e5ab] shadow-md'
                    : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* History Sub-periods Filter (when category is 'history' or 'all') */}
      {(category === 'history' || category === 'all') && (
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#f3e5ab]">
            <span className="flex items-center gap-1.5 font-semibold">
              <BookOpen size={13} />
              <span>Периоды истории России:</span>
            </span>
            {historyPeriodFilter && (
              <button
                type="button"
                onClick={() => onHistoryPeriodFilterChange(undefined)}
                className="text-white/40 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
              >
                <X size={11} /> Сбросить фильтр периода
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
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
                      ? 'bg-[rgba(243,229,171,0.18)] text-[#f3e5ab] border-[rgba(243,229,171,0.4)] shadow-sm'
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

      {/* Secondary Bar: Status Filters & Active Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
          <Filter size={12} className="text-white/30 ml-2 mr-1" />
          {STATUS_FILTERS.map((sf) => {
            const active = statusFilter === sf.value
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => onStatusFilterChange(sf.value)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {sf.label}
              </button>
            )
          })}
        </div>

        {/* Selected tag or tags pill cloud */}
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
              allTags.slice(0, 6).map((tag) => (
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

      {/* Pins Grid */}
      {pins.length === 0 ? (
        <div className="py-16 text-center space-y-3 glass-card rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
            <Search size={28} />
          </div>
          <h3 className="text-base font-semibold text-white/80">Ничего не найдено</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            {search || historyPeriodFilter || selectedTag
              ? 'Попробуйте изменить параметры поиска или сбросить активные фильтры'
              : 'В этом разделе пока нет закрепов. Добавьте первую ссылку или видео!'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              onPlay={onPlayPin}
              onTogglePin={onTogglePin}
              onDelete={onDeletePin}
              onUpdateEpisode={onUpdateEpisode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
