import React, { useState } from 'react'
import { Plus, X, ExternalLink } from 'lucide-react'
import type { QuickLink } from '../types'
import { uid } from '../utils'

interface QuickDockProps {
  links: QuickLink[]
  onAdd: (link: QuickLink) => void
  onRemove: (id: string) => void
}

export const QuickDock: React.FC<QuickDockProps> = ({ links, onAdd, onRemove }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [emoji, setEmoji] = useState('📌')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }
    onAdd({
      id: uid(),
      title: title.trim(),
      url: finalUrl,
      emoji: emoji.trim() || '📌',
    })
    setTitle('')
    setUrl('')
    setShowAdd(false)
  }

  return (
    <div className="w-full bg-white/[0.02] border-b border-white/[0.06] backdrop-blur-md py-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
        <span
          className="text-[10px] uppercase tracking-wider text-white/30 mr-1 hidden sm:inline"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Quick Dock:
        </span>

        {links.map((link) => (
          <div
            key={link.id}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl dock-btn text-xs font-medium text-white/80 hover:text-white transition-all shadow-sm"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <span className="text-sm leading-none">{link.emoji || '🔗'}</span>
              <span className="max-w-[130px] truncate">{link.title}</span>
              <ExternalLink size={10} className="text-white/20 group-hover:text-white/60" />
            </a>
            <button
              onClick={() => onRemove(link.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all ml-1"
              title="Удалить из дока"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl dock-btn text-xs text-white/40 hover:text-[#f3e5ab] transition-colors"
            title="Добавить быструю закладку"
          >
            <Plus size={12} />
            <span
              className="text-[11px]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Закладка
            </span>
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10"
          >
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-7 text-center bg-transparent text-xs text-white"
              placeholder="📌"
              maxLength={2}
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-24 bg-transparent text-xs text-white placeholder:text-white/30 px-1"
              placeholder="Название"
              autoFocus
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-32 bg-transparent text-xs text-white placeholder:text-white/30 px-1"
              placeholder="https://..."
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded-lg btn-gold text-xs font-semibold"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="p-1 text-white/40 hover:text-white"
            >
              <X size={12} />
            </button>
          </form>
        )}
      </div>

        <div
          className="hidden md:flex items-center gap-2 text-[10px] text-white/30"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span>Вкладки браузера не нужны</span>
        </div>
      </div>
    </div>
  )
}
