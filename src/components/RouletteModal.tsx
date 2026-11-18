import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Dices, Play, RefreshCw, Sparkles, ExternalLink } from 'lucide-react'
import type { Pin } from '../types'
import { PlatformBadge } from './Badges'

interface RouletteModalProps {
  open: boolean
  onClose: () => void
  pins: Pin[]
  onPlayPin: (pin: Pin) => void
}

export const RouletteModal: React.FC<RouletteModalProps> = ({
  open,
  onClose,
  pins,
  onPlayPin,
}) => {
  const queuedPins = pins.filter((p) => p.status === 'queued' || p.status === 'watching')
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)

  const spin = () => {
    if (queuedPins.length === 0) return
    setIsSpinning(true)
    setSelectedPin(null)

    let counter = 0
    const totalFlips = 16
    const intervalTime = 80

    const timer = setInterval(() => {
      const randIdx = Math.floor(Math.random() * queuedPins.length)
      setSelectedPin(queuedPins[randIdx])
      counter++

      if (counter >= totalFlips) {
        clearInterval(timer)
        setIsSpinning(false)
      }
    }, intervalTime)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="roulette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="roulette-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-md rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl btn-rose">
                  <Dices size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Медиа-рулетка</h3>
                  <p
                    className="text-xs text-white/40"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Кандидатов в очереди: {String(queuedPins.length).padStart(2, '0')}
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

            {/* Content */}
            <div className="p-6 text-center space-y-5">
              {queuedPins.length === 0 ? (
                <div className="py-8 text-white/30 space-y-2">
                  <Dices size={36} className="mx-auto opacity-30" />
                  <p className="text-sm">Нет закрепов в очереди</p>
                  <p className="text-xs text-white/20">
                    Добавьте пару видео или аниме в статус «В очереди»
                  </p>
                </div>
              ) : selectedPin ? (
                <motion.div
                  key={selectedPin.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 relative overflow-hidden"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10">
                    {selectedPin.thumbnailUrl || selectedPin.customThumbnailUrl ? (
                      <img
                        src={selectedPin.customThumbnailUrl || selectedPin.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Sparkles size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <PlatformBadge platform={selectedPin.platform} />
                    </div>
                  </div>

                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {selectedPin.title}
                    </h4>
                    {selectedPin.channelName && (
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        {selectedPin.channelName}
                      </p>
                    )}
                  </div>

                  {/* Actions for winner */}
                  {!isSpinning && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          onPlayPin(selectedPin)
                          onClose()
                        }}
                        className="flex-1 py-2.5 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Play size={14} /> Смотреть
                      </button>
                      <a
                        href={selectedPin.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title="Открыть внешнюю ссылку"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#f3e5ab]">
                    <Dices size={30} />
                  </div>
                  <p className="text-sm text-white/70">Не знаешь, что включить прямо сейчас?</p>
                  <p className="text-xs text-white/40 max-w-xs mx-auto">
                    Запусти случайный выбор среди всех твоих лекций и видео в очереди!
                  </p>
                </div>
              )}

              {/* Spin button */}
              {queuedPins.length > 0 && (
                <button
                  type="button"
                  onClick={spin}
                  disabled={isSpinning}
                  className={`w-full py-3 rounded-xl btn-rose text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform ${
                    isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <RefreshCw size={14} className={isSpinning ? 'animate-spin' : ''} />
                  <span>{isSpinning ? 'Выбираем...' : selectedPin ? 'Крутить еще раз' : 'Запустить рулетку'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
