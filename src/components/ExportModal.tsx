import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react'
import type { Pin, QuickLink } from '../types'
import { exportToJson, exportToClipboard, importFromJson } from '../utils/storage'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  pins: Pin[]
  quickLinks: QuickLink[]
  onImportSuccess: (imported: { pins: Pin[]; quickLinks?: QuickLink[] }) => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  pins,
  quickLinks,
  onImportSuccess,
}) => {
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCopy = () => {
    const json = exportToClipboard(pins)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    exportToJson(pins, quickLinks)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)
    try {
      const data = await importFromJson(file)
      onImportSuccess(data)
      onClose()
    } catch {
      setImportError('Ошибка при чтении JSON-файла. Проверьте формат.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="export-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="export-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-modal w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl btn-gold">
                  <FileJson size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Резервная копия &amp; Синхронизация</h3>
                  <p className="text-xs text-white/40">Перенос базы закрепов между ПК и телефоном</p>
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
            <div className="p-6 space-y-5">
              {/* Export section */}
              <div className="space-y-2">
                <label
                  className="text-[10px] text-white/40 uppercase tracking-wider block"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Экспорт данных
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#f3e5ab]/50 hover:bg-white/5 transition-all text-left flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Download size={18} className="text-[#f3e5ab] group-hover:scale-110 transition-transform" />
                      <span
                        className="text-[10px] text-white/30"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        .JSON
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Скачать файл</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Сохранить всю базу на диск</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#ff2a85]/50 hover:bg-white/5 transition-all text-left flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {copied ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Copy size={18} className="text-[#ff2a85] group-hover:scale-110 transition-transform" />
                      )}
                      <span
                        className="text-[10px] text-white/30"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        CLIPBOARD
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {copied ? 'Скопировано!' : 'Копировать JSON'}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">В буфер обмена для мессенджера</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Import section */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label
                  className="text-[10px] text-white/40 uppercase tracking-wider block"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Импорт данных
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer text-center space-y-1"
                >
                  <Upload size={24} className="mx-auto text-white/30" />
                  <p className="text-xs font-semibold text-white">
                    {isImporting ? 'Импортирование...' : 'Загрузить JSON-файл'}
                  </p>
                  <p className="text-[11px] text-white/40">
                    Нажмите для выбора сохраненного файла базы
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {importError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
                    <AlertCircle size={14} />
                    <span>{importError}</span>
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
