import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, CloudRain, Wind, Bell } from 'lucide-react'
import type { NoiseType } from '../types'
import { startNoise, stopNoise, setNoiseVolume, getCurrentNoiseType } from '../utils/audio'

interface PomodoroModalProps {
  open: boolean
  onClose: () => void
  display: string
  phase: 'work' | 'break' | 'idle'
  running: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSelectPreset: (work: number, brk: number) => void
  currentWorkMin: number
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  open,
  onClose,
  display,
  phase,
  running,
  onStart,
  onPause,
  onReset,
  onSelectPreset,
  currentWorkMin,
}) => {
  const [noiseType, setNoiseType] = useState<NoiseType>(getCurrentNoiseType())
  const [volume, setVolume] = useState(0.4)

  const handleNoiseToggle = (type: NoiseType) => {
    if (noiseType === type) {
      stopNoise()
      setNoiseType('silent')
    } else {
      startNoise(type, volume)
      setNoiseType(type)
    }
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    setNoiseVolume(newVol)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pomodoro-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="pomodoro-modal"
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
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Фокус &amp; Атмосферный шум</h3>
                  <p className="text-xs text-white/40">Pomodoro таймер и Web Audio генератор</p>
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
            <div className="p-6 space-y-6">
              {/* Presets */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPreset(45, 10)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    currentWorkMin === 45
                      ? 'btn-gold text-[#f3e5ab]'
                      : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                  }`}
                >
                  45 / 10 мин (Deep Work)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreset(25, 5)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    currentWorkMin === 25
                      ? 'btn-gold text-[#f3e5ab]'
                      : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                  }`}
                >
                  25 / 5 мин (Классика)
                </button>
              </div>

              {/* Big Timer Display */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3 relative overflow-hidden">
                <div
                  className="text-xs uppercase tracking-widest font-semibold"
                  style={{
                    color: phase === 'break' ? '#10b981' : '#ff2a85',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {phase === 'work' ? '● Фокус на обучении' : phase === 'break' ? '☕ Перерыв' : 'Готов к запуску'}
                </div>

                <div
                  className="text-5xl sm:text-6xl font-light tracking-tight text-white/95"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {display}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onReset}
                    className="p-3 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Сброс"
                  >
                    <RotateCcw size={16} />
                  </button>

                  {running ? (
                    <button
                      type="button"
                      onClick={onPause}
                      className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold flex items-center gap-2 hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <Pause size={16} /> Пауза
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStart}
                      className="px-6 py-3 rounded-xl btn-gold text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer transition-transform hover:scale-105"
                    >
                      <Play size={16} /> Старт
                    </button>
                  )}
                </div>
              </div>

              {/* Ambient Noise Generator (Web Audio API) */}
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label
                    className="text-[10px] text-white/40 uppercase tracking-wider block"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Фоновый звук (Web Audio)
                  </label>
                  <span
                    className="text-[10px] text-[#f3e5ab]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {noiseType === 'silent' ? 'ВЫКЛ' : noiseType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleNoiseToggle('silent')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      noiseType === 'silent'
                        ? 'bg-white/15 text-white border-white/20'
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <VolumeX size={13} />
                    <span>Тишина</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNoiseToggle('brown')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      noiseType === 'brown'
                        ? 'btn-gold text-[#f3e5ab] font-semibold'
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Wind size={13} />
                    <span>Brown Noise</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNoiseToggle('rain')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      noiseType === 'rain'
                        ? 'btn-rose text-[#ff2a85] font-semibold'
                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <CloudRain size={13} />
                    <span>Дождь</span>
                  </button>
                </div>

                {/* Volume Slider */}
                {noiseType !== 'silent' && (
                  <div className="flex items-center gap-3 pt-1">
                    <Volume2 size={14} className="text-white/40 shrink-0" />
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 accent-[#ff2a85] cursor-pointer"
                    />
                    <span
                      className="text-[10px] text-white/40 shrink-0 w-8 text-right"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
