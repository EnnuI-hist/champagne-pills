import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, X, Trash2 } from 'lucide-react'
import type { Pin } from '../types'

interface ToastUndoProps {
  queue: { pin: Pin; timeout: ReturnType<typeof setTimeout> }[]
  onUndo: (id: string) => void
  onDismiss: (id: string) => void
}

export const ToastUndo: React.FC<ToastUndoProps> = ({ queue, onUndo, onDismiss }) => {
  if (queue.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {queue.map(({ pin }) => (
          <motion.div
            key={pin.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl glass-card border border-[#ff2a85]/40 shadow-2xl backdrop-blur-2xl bg-[#0b0d13]/95 p-3.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#ff2a85]/15 text-[#ff2a85] shrink-0">
                  <Trash2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{pin.title}</p>
                  <p className="text-[11px] text-white/40">Перемещено в корзину</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUndo(pin.id)}
                  className="px-3 py-1.5 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 shadow-md"
                >
                  <RotateCcw size={12} />
                  <span>Вернуть (Undo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(pin.id)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Закрыть"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* 6-second animated countdown bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#f3e5ab] to-[#ff2a85]"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
