import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react'
import type { ThemePreset, ThemeSettings } from '../types'
import { PRESET_DATA } from '../hooks/useTheme'
import { compressImageToWebp, saveBlob, deleteBlob } from '../utils/db'

interface ThemeModalProps {
  open: boolean
  onClose: () => void
  settings: ThemeSettings
  onSetPreset: (preset: ThemePreset) => void
  onSetCustomBg: (key?: string) => void
  onSetDim: (dimAmount: number) => void
  onSetBlur: (blurAmount: number) => void
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  open,
  onClose,
  settings,
  onSetPreset,
  onSetCustomBg,
  onSetDim,
  onSetBlur,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    try {
      const compressed = await compressImageToWebp(file, 1200)
      const key = `custom_bg_${Date.now()}`
      await saveBlob(key, compressed)
      if (settings.customBgDbKey) {
        await deleteBlob(settings.customBgDbKey)
      }
      onSetCustomBg(key)
    } catch {
      alert('Ошибка при сохранении фонового изображения в IndexedDB')
    }
  }

  const handleClearBg = async () => {
    if (settings.customBgDbKey) {
      await deleteBlob(settings.customBgDbKey)
    }
    onSetCustomBg(undefined)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          await handleFileUpload(file)
          break
        }
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="theme-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          onPaste={handlePaste}
        >
          <motion.div
            key="theme-dialog"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#f3e5ab]" />
                <span className="text-sm font-semibold text-white/90">
                  Атмосфера &amp; Неоновые Темы
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 4 Presets */}
              <div>
                <p
                  className="text-[10px] text-white/40 uppercase tracking-wider mb-2.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Неоновый пресет
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PRESET_DATA) as ThemePreset[]).map((key) => {
                    const { label, emoji, accent } = PRESET_DATA[key]
                    const active = settings.preset === key
                    return (
                      <button
                        key={key}
                        onClick={() => onSetPreset(key)}
                        className="flex items-center gap-2.5 p-3 rounded-xl transition-all text-left"
                        style={{
                          background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${active ? accent : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? `0 0 16px ${accent}25` : undefined,
                        }}
                      >
                        <span className="text-xl leading-none">{emoji}</span>
                        <div className="min-w-0">
                          <div
                            className="text-xs font-semibold truncate"
                            style={{ color: active ? accent : 'rgba(255,255,255,0.7)' }}
                          >
                            {label}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom background image */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p
                    className="text-[10px] text-white/40 uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Свой фон (IndexedDB)
                  </p>
                  <span
                    className="text-[10px] text-[#f3e5ab]/80"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Ctrl+V вставляет фото
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl btn-gold text-xs font-medium cursor-pointer"
                  >
                    <Upload size={13} /> Выбрать файл с ПК
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload(f)
                    }}
                  />
                  {settings.customBgDbKey && (
                    <button
                      onClick={handleClearBg}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                      title="Удалить пользовательский фон"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {settings.customBgDbKey && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <ImageIcon size={14} />
                    <span>Фоновое изображение активно</span>
                  </div>
                )}
              </div>

              {/* Dim & Blur sliders */}
              {settings.customBgDbKey && (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div>
                    <div
                      className="flex justify-between mb-1.5 text-[10px] text-white/40"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span>Затемнение фона</span>
                      <span className="text-[#f3e5ab]">{settings.dimAmount}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={settings.dimAmount}
                      onChange={(e) => onSetDim(Number(e.target.value))}
                      className="w-full accent-[#f3e5ab] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div
                      className="flex justify-between mb-1.5 text-[10px] text-white/40"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span>Размытие (Blur)</span>
                      <span className="text-[#f3e5ab]">{settings.blurAmount}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={settings.blurAmount}
                      onChange={(e) => onSetBlur(Number(e.target.value))}
                      className="w-full accent-[#f3e5ab] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
