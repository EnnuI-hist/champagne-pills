import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Tv,
  Plus,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  Check,
  Star,
  Sparkles,
} from 'lucide-react'
import type { AnimeItem } from '../types'

interface AnimeListModalProps {
  open: boolean
  onClose: () => void
  animeList: AnimeItem[]
  onAddAnime: (item: Omit<AnimeItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateAnime: (item: AnimeItem) => void
  onDeleteAnime: (id: string) => void
  onToggleAnime: (id: string) => void
}

type AnimeFilter = 'all' | 'unwatched' | 'completed'

export const AnimeListModal: React.FC<AnimeListModalProps> = ({
  open,
  onClose,
  animeList,
  onAddAnime,
  onUpdateAnime,
  onDeleteAnime,
  onToggleAnime,
}) => {
  // New item form state
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newEpisodes, setNewEpisodes] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<AnimeFilter>('all')

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editEpisodes, setEditEpisodes] = useState('')
  const [editRating, setEditRating] = useState<number | undefined>(undefined)

  // Counts
  const totalCount = animeList.length
  const unwatchedCount = animeList.filter((a) => !a.isCompleted).length
  const completedCount = animeList.filter((a) => a.isCompleted).length

  // Filtered & searched list
  const filteredList = useMemo(() => {
    return animeList
      .filter((item) => {
        if (filter === 'unwatched') return !item.isCompleted
        if (filter === 'completed') return item.isCompleted
        return true
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          item.title.toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        // Unwatched first, then by updated date
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [animeList, filter, searchQuery])

  // Handle Add
  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newTitle.trim()) return

    const totalEp = newEpisodes.trim() ? parseInt(newEpisodes.trim(), 10) : undefined

    onAddAnime({
      title: newTitle.trim(),
      note: newNote.trim() || undefined,
      totalEpisodes: !isNaN(Number(totalEp)) ? totalEp : undefined,
      isCompleted: false,
    })

    setNewTitle('')
    setNewNote('')
    setNewEpisodes('')
  }

  // Start editing row
  const startEditing = (item: AnimeItem) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditNote(item.note || '')
    setEditEpisodes(item.totalEpisodes ? String(item.totalEpisodes) : '')
    setEditRating(item.rating)
  }

  // Save inline edit
  const saveEditing = (id: string) => {
    const original = animeList.find((a) => a.id === id)
    if (!original || !editTitle.trim()) return

    const totalEp = editEpisodes.trim() ? parseInt(editEpisodes.trim(), 10) : undefined

    onUpdateAnime({
      ...original,
      title: editTitle.trim(),
      note: editNote.trim() || undefined,
      totalEpisodes: !isNaN(Number(totalEp)) ? totalEp : undefined,
      rating: editRating,
      updatedAt: new Date().toISOString(),
    })

    setEditingId(null)
  }

  // Quick rating update
  const handleQuickRating = (item: AnimeItem, ratingVal: number) => {
    onUpdateAnime({
      ...item,
      rating: item.rating === ratingVal ? undefined : ratingVal,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="glass-modal w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl bg-[#090b10]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:px-6 border-b border-white/[0.08] shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#ff2a85]/15 border border-[#ff2a85]/30 text-[#ff2a85]">
                  <Tv size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>Мой список аниме</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#f3e5ab] font-normal mono">
                      {unwatchedCount} в планах
                    </span>
                  </h3>
                  <p className="text-xs text-white/40">
                    Тайтлы на будущее, отметки о просмотре и оценки
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Add Form in 1 Row */}
            <div className="p-4 sm:px-6 border-b border-white/[0.06] bg-white/[0.02]">
              <form onSubmit={handleAdd} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Название тайтла (напр. Врата Штейна)..."
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-[#ff2a85] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 transition-all outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={newEpisodes}
                      onChange={(e) => setNewEpisodes(e.target.value)}
                      placeholder="Серий"
                      className="w-20 bg-white/[0.04] border border-white/10 focus:border-[#ff2a85] rounded-xl px-2.5 py-2 text-xs text-[#f3e5ab] text-center mono placeholder:text-white/30 transition-all outline-none"
                      title="Количество серий"
                    />

                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Заметка (озвучка, совет...)"
                      className="flex-1 sm:w-44 bg-white/[0.04] border border-white/10 focus:border-[#ff2a85] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 transition-all outline-none"
                    />

                    <button
                      type="submit"
                      disabled={!newTitle.trim()}
                      className="px-4 py-2 rounded-xl btn-rose text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Добавить</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="p-3 sm:px-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    filter === 'all'
                      ? 'btn-gold text-[#f3e5ab] font-semibold shadow-sm'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span>Все</span>
                  <span className="mono text-[10px] opacity-70">({totalCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('unwatched')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    filter === 'unwatched'
                      ? 'btn-rose text-[#ff2a85] font-semibold shadow-sm'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span>В планах</span>
                  <span className="mono text-[10px] opacity-70">({unwatchedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('completed')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    filter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span>Просмотрено</span>
                  <span className="mono text-[10px] opacity-70">({completedCount})</span>
                </button>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-3 top-2.5 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по списку..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#f3e5ab] transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-white/40 hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 min-h-[220px]">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-white/30 space-y-2">
                  <Sparkles size={28} className="mx-auto opacity-30 text-[#ff2a85]" />
                  <p className="text-xs font-medium text-white/60">
                    {searchQuery
                      ? 'Ничего не найдено по вашему запросу'
                      : filter === 'completed'
                      ? 'В списке пока нет просмотренных аниме'
                      : filter === 'unwatched'
                      ? 'Все запланированные аниме просмотрены!'
                      : 'Ваш список аниме пока пуст'}
                  </p>
                  <p className="text-[11px] text-white/30 max-w-xs mx-auto">
                    {searchQuery
                      ? 'Попробуйте изменить поисковую фразу'
                      : 'Введите название тайтла в поле сверху и нажмите Enter'}
                  </p>
                </div>
              ) : (
                filteredList.map((item) => {
                  const isEditing = editingId === item.id

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white/[0.05] border border-[#ff2a85]/40 space-y-2.5 transition-all shadow-lg"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Название тайтла..."
                            className="sm:col-span-6 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#ff2a85] outline-none"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editEpisodes}
                            onChange={(e) => setEditEpisodes(e.target.value)}
                            placeholder="Серий"
                            className="sm:col-span-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-[#f3e5ab] text-center mono focus:border-[#ff2a85] outline-none"
                          />
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Заметка к тайтлу..."
                            className="sm:col-span-4 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#ff2a85] outline-none"
                          />
                        </div>

                        {/* Rating row during edit */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1 text-[11px] text-white/50">
                            <span>Оценка:</span>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setEditRating(editRating === star ? undefined : star)
                                }
                                className="p-0.5 text-white/20 hover:text-[#f3e5ab] cursor-pointer"
                                style={{
                                  color: editRating && editRating >= star ? '#f3e5ab' : undefined,
                                }}
                              >
                                <Star
                                  size={12}
                                  fill={editRating && editRating >= star ? 'currentColor' : 'none'}
                                />
                              </button>
                            ))}
                            {editRating && (
                              <span className="ml-1 text-[#f3e5ab] font-bold mono">
                                {editRating}/10
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              Отмена
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditing(item.id)}
                              className="px-3 py-1 rounded-lg btn-rose text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md"
                            >
                              <Check size={12} /> Сохранить
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                        item.isCompleted
                          ? 'bg-white/[0.01] border-white/5 hover:border-white/10'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Left: Checkbox + Title + Meta */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {/* Big Clickable Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleAnime(item.id)}
                          className="mt-0.5 sm:mt-0 p-1 text-white/40 hover:text-white cursor-pointer transition-transform hover:scale-110 shrink-0"
                          title={
                            item.isCompleted
                              ? 'Вернуть в список запланированных'
                              : 'Отметить как просмотренное'
                          }
                        >
                          {item.isCompleted ? (
                            <CheckSquare size={18} className="text-emerald-400" />
                          ) : (
                            <Square size={18} className="text-white/30 hover:text-[#ff2a85]" />
                          )}
                        </button>

                        {/* Title & Notes */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-semibold transition-colors ${
                                item.isCompleted
                                  ? 'line-through text-white/40'
                                  : 'text-white/95 group-hover:text-[#f3e5ab]'
                              }`}
                            >
                              {item.title}
                            </span>

                            {/* Total Episodes badge */}
                            {item.totalEpisodes && (
                              <span className="px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-[10px] text-[#f3e5ab] mono font-semibold">
                                {item.totalEpisodes} эп.
                              </span>
                            )}

                            {/* Rating badge */}
                            {item.rating && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#f3e5ab]/10 border border-[#f3e5ab]/30 text-[10px] text-[#f3e5ab] font-bold mono">
                                ★ {item.rating}
                              </span>
                            )}
                          </div>

                          {/* Note / Comment */}
                          {item.note && (
                            <p
                              className={`text-[11px] truncate max-w-md ${
                                item.isCompleted ? 'text-white/30' : 'text-white/50'
                              }`}
                            >
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions (Rating Stars on hover + Edit + Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick 1-click rating stars (visible on hover) */}
                        <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleQuickRating(item, star)}
                              className="p-0.5 text-white/20 hover:text-[#f3e5ab] cursor-pointer"
                              title={`Поставить оценку ${star}/10`}
                              style={{
                                color:
                                  item.rating && item.rating >= star ? '#f3e5ab' : undefined,
                              }}
                            >
                              <Star
                                size={11}
                                fill={item.rating && item.rating >= star ? 'currentColor' : 'none'}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-[#f3e5ab] hover:bg-white/5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Редактировать тайтл"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDeleteAnime(item.id)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Удалить из списка"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 sm:px-6 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/40 bg-white/[0.01]">
              <div className="flex items-center gap-2 mono">
                <span>Всего: {totalCount}</span>
                <span>•</span>
                <span className="text-[#f3e5ab]">В планах: {unwatchedCount}</span>
                <span>•</span>
                <span className="text-emerald-400">Просмотрено: {completedCount}</span>
              </div>
              <span className="text-[10px] text-white/30 hidden sm:inline">
                Enter в строке ввода — быстрое добавление
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
