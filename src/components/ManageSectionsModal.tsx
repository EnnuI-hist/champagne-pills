import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings2, Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { Collection } from '../types'

interface ManageSectionsModalProps {
  open: boolean
  onClose: () => void
  collections: Collection[]
  onReorder: (collections: Collection[]) => void
  onEdit: (col: Collection) => void
  onDelete: (id: string) => void
  onAddNew: () => void
  getPinCount?: (id: string) => number
}

export const ManageSectionsModal: React.FC<ManageSectionsModalProps> = ({
  open,
  onClose,
  collections,
  onReorder,
  onEdit,
  onDelete,
  onAddNew,
  getPinCount,
}) => {
  const handleMove = (index: number, delta: number) => {
    const targetIndex = index + delta
    if (targetIndex < 0 || targetIndex >= collections.length) return
    const updated = [...collections]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    onReorder(updated)
  }

  const handleDelete = (col: Collection) => {
    if (confirm(`Удалить раздел «${col.name}»? Закрепы не удалятся, а останутся во вкладке «Все».`)) {
      onDelete(col.id)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="manage-sections-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="manage-sections-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl bg-[#0b0d13]/95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl btn-gold text-[#f3e5ab]">
                  <Settings2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Управление разделами</h3>
                  <p className="text-xs text-white/40">
                    Сортируйте, переименовывайте и настраивайте разделы
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {collections.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 space-y-2">
                  <p>У вас пока нет пользовательских разделов.</p>
                  <p className="text-[11px] text-white/30">
                    Создайте разделы для организации (например: «СУМЕРКИ», «Лекции», «Аниме»).
                  </p>
                </div>
              ) : (
                collections.map((col, idx) => {
                  const count = getPinCount ? getPinCount(col.id) : undefined
                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-all group"
                    >
                      {/* Left: Move buttons + Emoji + Title */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Up/Down buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, -1)}
                            disabled={idx === 0}
                            className="p-0.5 rounded text-white/30 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            title="Поднять выше"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 1)}
                            disabled={idx === collections.length - 1}
                            className="p-0.5 rounded text-white/30 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            title="Опустить ниже"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        <span className="text-lg leading-none shrink-0">{col.emoji || '📁'}</span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white/90 truncate">
                              {col.name}
                            </span>
                            {col.color && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: col.color,
                                  boxShadow: `0 0 6px ${col.color}`,
                                }}
                              />
                            )}
                          </div>
                          {count !== undefined && (
                            <span className="text-[10px] text-white/40 mono">
                              {count} {count === 1 ? 'закреп' : count >= 2 && count <= 4 ? 'закрепа' : 'закрепов'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Edit & Delete buttons */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onEdit(col)
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#f3e5ab] transition-colors cursor-pointer"
                          title="Редактировать раздел"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(col)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors cursor-pointer"
                          title="Удалить раздел (закрепы останутся в «Все»)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-white/[0.08] bg-black/30">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onAddNew()
                }}
                className="px-4 py-2 rounded-xl btn-gold text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={14} />
                <span>Новый раздел</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Готово
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
