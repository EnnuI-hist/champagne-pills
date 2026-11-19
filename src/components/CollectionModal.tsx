import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Check, Trash2 } from 'lucide-react'
import type { Collection } from '../types'
import { uid } from '../utils'

interface CollectionModalProps {
  open: boolean
  onClose: () => void
  onSave: (collection: Collection) => void
  onDelete?: (id: string) => void
  initialCollection?: Collection | null
}

const PRESET_EMOJIS = ['🎬', '🍿', '🧛', '📜', '📚', '⚔️', '🪐', '🎨', '🎵', '🎮', '💻', '🧠', '🏛️', '☕', '🌟', '🔥', '💎', '👑']

const PRESET_COLORS = [
  { value: '#f3e5ab', label: 'Champagne' },
  { value: '#ff2a85', label: 'Rose Neon' },
  { value: '#a855f7', label: 'Cyber Violet' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Amber' },
  { value: '#ef4444', label: 'Crimson' },
]

export const CollectionModal: React.FC<CollectionModalProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  initialCollection,
}) => {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍿')
  const [color, setColor] = useState('#f3e5ab')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (initialCollection) {
        setName(initialCollection.name)
        setEmoji(initialCollection.emoji || '🍿')
        setColor(initialCollection.color || '#f3e5ab')
      } else {
        setName('')
        setEmoji('🍿')
        setColor('#f3e5ab')
      }
      setError('')
    }
  }, [open, initialCollection])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите название раздела')
      return
    }

    const col: Collection = {
      id: initialCollection?.id || `col_${uid()}`,
      name: name.trim(),
      emoji: emoji.trim() || '📁',
      color,
      isDefault: initialCollection?.isDefault,
    }

    onSave(col)
    onClose()
  }

  const handleDelete = () => {
    if (!initialCollection || !onDelete) return
    if (confirm(`Удалить раздел «${initialCollection.name}»? Закрепы останутся во вкладке «Все закрепы».`)) {
      onDelete(initialCollection.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="collection-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="collection-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-md rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl bg-[#0b0d13]/95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl btn-gold text-[#f3e5ab]">
                  <FolderPlus size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {initialCollection ? 'Редактировать раздел' : 'Новый раздел (коллекция)'}
                  </h3>
                  <p className="text-xs text-white/40">Для группировки сериалов, лекций или фильмов</p>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name input */}
              <div>
                <label
                  className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Название раздела *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="Например: СУМЕРКИ или История: Борисов"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#f3e5ab] transition-all"
                  autoFocus
                />
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>

              {/* Emoji Picker */}
              <div>
                <label
                  className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Иконка / Эмодзи
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-12 h-10 text-center text-xl bg-white/5 border border-white/10 rounded-xl focus:border-[#f3e5ab]"
                  />
                  <div className="flex-1 flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-white/[0.02] border border-white/5 rounded-xl scrollbar-none">
                    {PRESET_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          emoji === e ? 'bg-white/20 scale-105' : 'hover:bg-white/10'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Neon Color Badge Picker */}
              <div>
                <label
                  className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Неоновый цвет бейджа
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((c) => {
                    const active = color === c.value
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          active
                            ? 'border-white/40 shadow-lg scale-105'
                            : 'border-transparent bg-white/5 hover:bg-white/10'
                        }`}
                        style={{
                          color: c.value,
                          backgroundColor: active ? `${c.value}25` : undefined,
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.value, boxShadow: `0 0 8px ${c.value}` }}
                        />
                        <span>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                {initialCollection && !initialCollection.isDefault && onDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Удалить</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{initialCollection ? 'Сохранить' : 'Создать'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
