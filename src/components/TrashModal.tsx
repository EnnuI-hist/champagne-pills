import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react'
import type { Pin } from '../types'
import { PlatformBadge } from './Badges'

interface TrashModalProps {
  open: boolean
  onClose: () => void
  pins: Pin[]
  onRestore: (id: string) => void
  onHardDelete: (id: string) => void
  onEmptyTrash: () => void
}

export const TrashModal: React.FC<TrashModalProps> = ({
  open,
  onClose,
  pins,
  onRestore,
  onHardDelete,
  onEmptyTrash,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="trash-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="trash-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Корзина закрепов</h3>
                  <p
                    className="text-xs text-white/40"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Удалено объектов: {String(pins.length).padStart(2, '0')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pins.length > 0 && (
                  <button
                    type="button"
                    onClick={onEmptyTrash}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle size={13} />
                    <span>Очистить всё</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {pins.length === 0 ? (
                <div className="py-12 text-center text-white/30 space-y-2">
                  <Trash2 size={36} className="mx-auto opacity-30" />
                  <p className="text-sm">Корзина пуста</p>
                  <p className="text-xs text-white/20">
                    Удаленные закрепы будут храниться здесь до полной очистки
                  </p>
                </div>
              ) : (
                pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {pin.thumbnailUrl ? (
                        <img
                          src={pin.thumbnailUrl}
                          alt=""
                          className="w-14 h-9 object-cover rounded-lg shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-9 bg-white/5 rounded-lg shrink-0 flex items-center justify-center text-white/20">
                          <Trash2 size={14} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-white/90 truncate">{pin.title}</p>
                          <PlatformBadge platform={pin.platform} />
                        </div>
                        <p className="text-[11px] text-white/40 truncate">
                          {pin.channelName || pin.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={pin.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        title="Открыть ссылку"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        type="button"
                        onClick={() => onRestore(pin.id)}
                        className="px-2.5 py-1.5 rounded-lg btn-gold text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Восстановить"
                      >
                        <RotateCcw size={12} />
                        <span className="hidden sm:inline">Восстановить</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onHardDelete(pin.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Удалить навсегда"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
