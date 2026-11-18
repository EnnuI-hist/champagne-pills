import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  CloudRain,
  Sparkles,
} from 'lucide-react'
import type { NoiseType } from '../types'
import { startNoise, stopNoise, setNoiseVolume, getCurrentNoiseType } from '../utils/audio'

interface PomodoroPopoverProps {
  display: string
  phase: 'work' | 'break' | 'idle'
  running: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSelectPreset: (work: number, brk: number) => void
  currentWorkMin: number
}

export const PomodoroPopover: React.FC<PomodoroPopoverProps> = ({
  display,
  phase,
  running,
  onStart,
  onPause,
  onReset,
  onSelectPreset,
  currentWorkMin,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [noiseType, setNoiseType] = useState<NoiseType>(getCurrentNoiseType())
  const [volume, setVolume] = useState(0.4)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
          running
            ? phase === 'break'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold'
              : 'btn-rose text-[#ff2a85] font-semibold animate-pulse shadow-lg'
            : isOpen
            ? 'bg-white/10 text-white border-white/20'
            : 'dock-btn text-white/70 hover:text-white'
        }`}
        title="Фокус: Помодоро-таймер и Web Audio шум"
      >
        <Bell size={14} className={running ? 'animate-bounce text-[#ff2a85]' : ''} />
        <span
          className="mono text-xs font-semibold"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {running ? display : 'Фокус'}
        </span>
      </button>

      {/* Floating Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl glass-modal border border-white/10 shadow-2xl p-4 z-50 bg-[#0d0f17]/95 backdrop-blur-2xl space-y-4"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg btn-rose">
                  <Sparkles size={13} className="text-[#ff2a85]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Фокус &amp; Атмосфера</h4>
                  <p
                    className="text-[10px] uppercase font-semibold"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: phase === 'break' ? '#10b981' : '#ff2a85',
                    }}
                  >
                    {phase === 'work'
                      ? '● Рабочая сессия'
                      : phase === 'break'
                      ? '☕ Перерыв'
                      : 'Готов к запуску'}
                  </p>
                </div>
              </div>

              <div
                className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#f3e5ab] mono"
              >
                {currentWorkMin} мин
              </div>
            </div>

            {/* Presets 45/10 and 25/5 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectPreset(45, 10)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  currentWorkMin === 45
                    ? 'btn-gold text-[#f3e5ab] shadow-sm'
                    : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                }`}
              >
                45 / 10 мин (Deep Work)
              </button>
              <button
                type="button"
                onClick={() => onSelectPreset(25, 5)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  currentWorkMin === 25
                    ? 'btn-gold text-[#f3e5ab] shadow-sm'
                    : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                }`}
              >
                25 / 5 мин (Классика)
              </button>
            </div>

            {/* Big Countdown Timer */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
              <div
                className="text-4xl font-light tracking-tight text-white mono"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {display}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onReset}
                  className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Сброс"
                >
                  <RotateCcw size={14} />
                </button>

                {running ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Pause size={13} /> Пауза
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStart}
                    className="px-5 py-2 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Play size={13} /> Старт
                  </button>
                )}
              </div>
            </div>

            {/* Web Audio API Noise Generator */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wider">
                <span>Процедурный шум (Web Audio)</span>
                <span
                  className="text-[#f3e5ab] font-bold mono"
                >
                  {noiseType === 'silent' ? 'ВЫКЛ' : noiseType.toUpperCase()}
                </span>
              </div>

              {/* Noise Switchers */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNoiseToggle('silent')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    noiseType === 'silent'
                      ? 'bg-white/15 text-white border-white/20 font-semibold'
                      : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <VolumeX size={12} />
                  <span>Выкл</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNoiseToggle('brown')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    noiseType === 'brown'
                      ? 'btn-gold text-[#f3e5ab] font-semibold shadow-sm'
                      : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                  }`}
                  title="Мягкий Brown Noise"
                >
                  <Wind size={12} />
                  <span>Brown</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNoiseToggle('rain')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    noiseType === 'rain'
                      ? 'btn-rose text-[#ff2a85] font-semibold shadow-sm'
                      : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                  }`}
                  title="Ночной дождь"
                >
                  <CloudRain size={12} />
                  <span>Дождь</span>
                </button>
              </div>

              {/* Volume Slider */}
              {noiseType !== 'silent' && (
                <div className="flex items-center gap-2 pt-1.5">
                  <Volume2 size={13} className="text-white/40 shrink-0" />
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-[#ff2a85] cursor-pointer h-1.5"
                  />
                  <span
                    className="text-[10px] text-white/40 mono w-7 text-right shrink-0"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
