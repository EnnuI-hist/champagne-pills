import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Palette, Bell, Dices, Trash2, ExternalLink, Play, Tag } from 'lucide-react'
import type { Pin, QuickLink } from '../types'
import { PlatformBadge } from './Badges'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  pins: Pin[]
  quickLinks: QuickLink[]
  onSelectPin: (pin: Pin) => void
  onOpenAdd: () => void
  onOpenTheme: () => void
  onOpenPomodoro: () => void
  onOpenRoulette: () => void
  onOpenTrash: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  pins,
  quickLinks,
  onSelectPin,
  onOpenAdd,
  onOpenTheme,
  onOpenPomodoro,
  onOpenRoulette,
  onOpenTrash,
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter items
  const activePins = pins.filter((p) => p.status !== 'deleted')
  const matchedPins = query.trim()
    ? activePins.filter((p) => {
        const q = query.toLowerCase()
        const text = `${p.title} ${p.channelName || ''} ${(p.tags || []).join(' ')} ${p.note || ''}`.toLowerCase()
        return text.includes(q)
      }).slice(0, 6)
    : activePins.slice(0, 4)

  const matchedLinks = query.trim()
    ? quickLinks.filter((l) => l.title.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : quickLinks.slice(0, 3)

  const actions = [
    {
      id: 'action-add',
      title: 'Создать новый закреп',
      sub: 'Вставить ссылку на видео, лекцию или аниме',
      icon: <Plus size={16} className="text-[#f3e5ab]" />,
      run: () => {
        onClose()
        onOpenAdd()
      },
    },
    {
      id: 'action-pomodoro',
      title: 'Таймер фокуса и шум',
      sub: '45/10, 25/5, Brown noise и дождь',
      icon: <Bell size={16} className="text-[#ff2a85]" />,
      run: () => {
        onClose()
        onOpenPomodoro()
      },
    },
    {
      id: 'action-theme',
      title: 'Сменить атмосферу и неон',
      sub: 'Champagne, Cyber, Emerald, Crimson или свой фон',
      icon: <Palette size={16} className="text-purple-400" />,
      run: () => {
        onClose()
        onOpenTheme()
      },
    },
    {
      id: 'action-roulette',
      title: 'Запустить медиа-рулетку',
      sub: 'Случайный выбор из очереди просмотра',
      icon: <Dices size={16} className="text-pink-400" />,
      run: () => {
        onClose()
        onOpenRoulette()
      },
    },
    {
      id: 'action-trash',
      title: 'Открыть корзину',
      sub: 'Просмотр и восстановление удаленных закрепов',
      icon: <Trash2 size={16} className="text-red-400" />,
      run: () => {
        onClose()
        onOpenTrash()
      },
    },
  ].filter((a) => !query.trim() || a.title.toLowerCase().includes(query.toLowerCase()))

  const totalItemsCount = matchedPins.length + matchedLinks.length + actions.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItemsCount))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % Math.max(1, totalItemsCount))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // execute selected
      if (selectedIndex < matchedPins.length) {
        onSelectPin(matchedPins[selectedIndex])
        onClose()
      } else if (selectedIndex < matchedPins.length + matchedLinks.length) {
        const link = matchedLinks[selectedIndex - matchedPins.length]
        window.open(link.url, '_blank')
        onClose()
      } else {
        const action = actions[selectedIndex - matchedPins.length - matchedLinks.length]
        action?.run()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmd-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="cmd-modal"
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="glass-modal w-full max-w-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 p-4 px-5 border-b border-white/[0.08]">
              <Search size={18} className="text-[#f3e5ab] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Ищи закрепы, теги, ссылки или команды..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <span
                className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded shrink-0"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ESC
              </span>
            </div>

            {/* Results list */}
            <div className="p-3 max-h-96 overflow-y-auto space-y-4">
              {/* Pins section */}
              {matchedPins.length > 0 && (
                <div>
                  <div
                    className="text-[10px] text-white/30 uppercase tracking-wider px-3 mb-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Закрепы
                  </div>
                  <div className="space-y-1">
                    {matchedPins.map((pin, i) => {
                      const isSelected = selectedIndex === i
                      return (
                        <div
                          key={pin.id}
                          onClick={() => {
                            onSelectPin(pin)
                            onClose()
                          }}
                          className={`flex items-center justify-between p-2.5 px-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-white/5 text-[#f3e5ab] shrink-0">
                              <Play size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{pin.title}</p>
                              <div className="flex items-center gap-2 text-[11px] text-white/40">
                                <span>{pin.channelName || pin.platform}</span>
                                {pin.tags && pin.tags.length > 0 && (
                                  <span className="text-[#f3e5ab]/70">{pin.tags.join(' ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <PlatformBadge platform={pin.platform} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick links section */}
              {matchedLinks.length > 0 && (
                <div>
                  <div
                    className="text-[10px] text-white/30 uppercase tracking-wider px-3 mb-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Quick Dock
                  </div>
                  <div className="space-y-1">
                    {matchedLinks.map((link, i) => {
                      const itemIdx = matchedPins.length + i
                      const isSelected = selectedIndex === itemIdx
                      return (
                        <div
                          key={link.id}
                          onClick={() => {
                            window.open(link.url, '_blank')
                            onClose()
                          }}
                          className={`flex items-center justify-between p-2.5 px-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{link.emoji || '🔗'}</span>
                            <span className="text-xs font-semibold text-white">{link.title}</span>
                          </div>
                          <ExternalLink size={13} className="text-white/30" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions section */}
              {actions.length > 0 && (
                <div>
                  <div
                    className="text-[10px] text-white/30 uppercase tracking-wider px-3 mb-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Действия
                  </div>
                  <div className="space-y-1">
                    {actions.map((act, i) => {
                      const itemIdx = matchedPins.length + matchedLinks.length + i
                      const isSelected = selectedIndex === itemIdx
                      return (
                        <div
                          key={act.id}
                          onClick={act.run}
                          className={`flex items-center justify-between p-2.5 px-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-white/5 shrink-0">{act.icon}</div>
                            <div>
                              <p className="text-xs font-semibold text-white">{act.title}</p>
                              <p className="text-[11px] text-white/40">{act.sub}</p>
                            </div>
                          </div>
                          <span
                            className="text-[10px] text-white/30"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            ↵
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {totalItemsCount === 0 && (
                <div className="py-8 text-center text-white/30 space-y-1">
                  <Tag size={24} className="mx-auto opacity-30" />
                  <p className="text-xs">Ничего не найдено по запросу «{query}»</p>
                </div>
              )}
            </div>

            {/* Footer with key hints */}
            <div className="p-2.5 px-4 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-[11px] text-white/30">
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ↑↓ Навигация • ↵ Выбрать • ESC Закрыть
              </span>
              <span
                className="text-[#f3e5ab]/60"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                champagne&amp;pills
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
