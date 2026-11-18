import React from 'react'
import {
  Palette,
  Sparkles,
  Plus,
  Search,
  Dices,
  Trash2,
  FileJson,
} from 'lucide-react'
import { BrandWordmark } from './BrandWordmark'
import { PomodoroPopover } from './PomodoroPopover'
import type { ThemePreset } from '../types'
import { PRESET_DATA } from '../hooks/useTheme'

interface HeaderProps {
  currentPreset: ThemePreset
  onOpenTheme: () => void
  onOpenAdd: () => void
  onOpenCommand: () => void
  onOpenRoulette: () => void
  onOpenTrash: () => void
  onOpenExport: () => void
  totalPinsCount?: number
  deletedPinsCount?: number
  isPomodoroRunning: boolean
  pomodoroDisplay: string
  pomodoroPhase: 'work' | 'break' | 'idle'
  onPomodoroStart: () => void
  onPomodoroPause: () => void
  onPomodoroReset: () => void
  onSelectPomodoroPreset: (work: number, brk: number) => void
  currentWorkMin: number
}

export const Header: React.FC<HeaderProps> = ({
  currentPreset,
  onOpenTheme,
  onOpenAdd,
  onOpenCommand,
  onOpenRoulette,
  onOpenTrash,
  onOpenExport,
  totalPinsCount = 0,
  deletedPinsCount = 0,
  isPomodoroRunning,
  pomodoroDisplay,
  pomodoroPhase,
  onPomodoroStart,
  onPomodoroPause,
  onPomodoroReset,
  onSelectPomodoroPreset,
  currentWorkMin,
}) => {
  const presetInfo = PRESET_DATA[currentPreset]

  return (
    <header className="glass-header sticky top-0 z-40 w-full px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <BrandWordmark size="md" />
        </div>

        {/* Center: Search & Stats (in JetBrains Mono) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Command Trigger */}
          <button
            type="button"
            onClick={onOpenCommand}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <Search size={13} className="text-[#f3e5ab]" />
            <span>Поиск и команды</span>
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Ctrl+K
            </kbd>
          </button>

          {/* Active pins count */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-white/40"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Sparkles size={12} className="text-[#f3e5ab]" />
            <span className="text-[#f3e5ab] font-medium">
              {String(totalPinsCount).padStart(2, '0')}
            </span>
            <span>активных</span>
          </div>
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pomodoro Focus & Noise Popover Widget in Header */}
          <PomodoroPopover
            display={pomodoroDisplay}
            phase={pomodoroPhase}
            running={isPomodoroRunning}
            onStart={onPomodoroStart}
            onPause={onPomodoroPause}
            onReset={onPomodoroReset}
            onSelectPreset={onSelectPomodoroPreset}
            currentWorkMin={currentWorkMin}
          />

          {/* Roulette Button */}
          <button
            type="button"
            onClick={onOpenRoulette}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl dock-btn text-xs font-medium text-white/70 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Медиа-рулетка: случайный выбор из очереди"
          >
            <Dices size={14} className="text-[#ff2a85]" />
            <span className="hidden lg:inline">Рулетка</span>
          </button>

          {/* Export / Sync Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl dock-btn text-xs font-medium text-white/70 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            title="Экспорт и импорт базы в JSON"
          >
            <FileJson size={14} className="text-[#f3e5ab]" />
            <span className="hidden xl:inline">База</span>
          </button>

          {/* Trash Button */}
          <button
            type="button"
            onClick={onOpenTrash}
            className="relative p-2 rounded-xl dock-btn text-xs font-medium text-white/60 hover:text-white transition-all cursor-pointer"
            title="Корзина удаленных закрепов"
          >
            <Trash2 size={14} />
            {deletedPinsCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center mono"
              >
                {deletedPinsCount}
              </span>
            )}
          </button>

          {/* Atmosphere / Theme Preset Button */}
          <button
            type="button"
            onClick={onOpenTheme}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl dock-btn text-xs font-medium text-white/80 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Сменить атмосферу и тему оформления"
          >
            <Palette size={14} style={{ color: presetInfo.accent }} />
            <span className="hidden md:inline text-xs">{presetInfo.label}</span>
            <span
              className="mono text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: presetInfo.accent,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {presetInfo.emoji}
            </span>
          </button>

          {/* Add Pin Primary Button */}
          <button
            type="button"
            onClick={onOpenAdd}
            className="px-3 sm:px-4 py-1.5 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Закреп</span>
            <kbd
              className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-black/30 text-[#f3e5ab] mono ml-0.5"
            >
              N
            </kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
