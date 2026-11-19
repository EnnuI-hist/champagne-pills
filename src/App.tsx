import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from './components/Header'
import { QuickDock } from './components/QuickDock'
import { ThemeModal } from './components/ThemeModal'
import { AddPinModal } from './components/AddPinModal'
import { PlayerModal } from './components/PlayerModal'
import { PomodoroModal } from './components/PomodoroModal'
import { RouletteModal } from './components/RouletteModal'
import { CommandPalette } from './components/CommandPalette'
import { TrashModal } from './components/TrashModal'
import { ExportModal } from './components/ExportModal'
import { CollectionModal } from './components/CollectionModal'
import { ToastUndo } from './components/ToastUndo'
import { PinGrid } from './components/PinGrid'

import { useTheme } from './hooks/useTheme'
import { usePins, useFilteredPins } from './hooks/usePins'
import { usePomodoro } from './hooks/usePomodoro'
import {
  loadQuickLinks,
  saveQuickLinks,
  loadCollections,
  saveCollections,
} from './utils/storage'
import { getBlobUrl } from './utils/db'

import type {
  Pin,
  QuickLink,
  Category,
  Status,
  StatusFilter,
  Collection,
  PlaylistPart,
} from './types'

export default function App() {
  // Theme & Atmosphere
  const { settings, setPreset, setCustomBg, setDim, setBlur } = useTheme()
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null)
  const [showThemeModal, setShowThemeModal] = useState(false)

  // Collections (Categories)
  const [collections, setCollections] = useState<Collection[]>(loadCollections)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)

  // Pins & Data
  const {
    pins,
    addPin,
    updatePin,
    softDelete,
    hardDelete,
    undoDelete,
    restoreFromTrash,
    emptyTrash,
    undoQueue,
    movePinUp,
    movePinDown,
    sync,
  } = usePins()

  // Quick Dock
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])
  useEffect(() => {
    setQuickLinks(loadQuickLinks())
  }, [])

  const handleAddQuickLink = (link: QuickLink) => {
    const updated = [...quickLinks, link]
    setQuickLinks(updated)
    saveQuickLinks(updated)
  }

  const handleRemoveQuickLink = (id: string) => {
    const updated = quickLinks.filter((l) => l.id !== id)
    setQuickLinks(updated)
    saveQuickLinks(updated)
  }

  // Load custom background from IndexedDB
  useEffect(() => {
    if (settings.customBgDbKey) {
      getBlobUrl(settings.customBgDbKey).then((url) => {
        setCustomBgUrl(url)
      })
    } else {
      setCustomBgUrl(null)
    }
  }, [settings.customBgDbKey])

  // Filters & State
  const [category, setCategory] = useState<Category>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const search = ''
  const [selectedTag, setSelectedTag] = useState<string | undefined>()

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [initialPasteUrl, setInitialPasteUrl] = useState('')
  const [activePlayerPin, setActivePlayerPin] = useState<Pin | null>(null)
  const [showPomodoroModal, setShowPomodoroModal] = useState(false)
  const [showRouletteModal, setShowRouletteModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showTrashModal, setShowTrashModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // Pomodoro
  const [workMin, setWorkMin] = useState(45)
  const [breakMin, setBreakMin] = useState(10)
  const pomodoro = usePomodoro(workMin, breakMin)

  const handleSelectPomodoroPreset = (w: number, b: number) => {
    setWorkMin(w)
    setBreakMin(b)
    pomodoro.reset()
  }

  // All active pins (not in trash)
  const allActivePins = useMemo(() => pins.filter((p) => p.status !== 'deleted'), [pins])

  // Filtered Pins
  const { filtered, trash } = useFilteredPins(
    pins,
    category,
    search,
    statusFilter,
    selectedTag,
  )

  // Filtered pins with pinned cards sorted to the top
  const displayPins = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }, [filtered])

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    const target = pins.find((p) => p.id === id)
    if (target) {
      updatePin({ ...target, status: newStatus })
    }
  }

  // Collection Handlers
  const handleSaveCollection = (col: Collection) => {
    setCollections((prev) => {
      const exists = prev.some((c) => c.id === col.id)
      const updated = exists ? prev.map((c) => (c.id === col.id ? col : c)) : [...prev, col]
      saveCollections(updated)
      return updated
    })
    setCategory(col.id)
  }

  const handleDeleteCollection = (id: string) => {
    setCollections((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveCollections(updated)
      return updated
    })
    if (category === id) {
      setCategory('all')
    }
  }

  // Pin Actions
  const handleTogglePin = useCallback(
    (id: string) => {
      const target = pins.find((p) => p.id === id)
      if (target) {
        updatePin({ ...target, isPinned: !target.isPinned })
      }
    },
    [pins, updatePin],
  )

  const handleUpdateEpisode = useCallback(
    (id: string, newEp: number) => {
      const target = pins.find((p) => p.id === id)
      if (target) {
        updatePin({
          ...target,
          currentEpisode: newEp,
          currentEp: newEp,
          updatedAt: new Date().toISOString(),
        })
      }
    },
    [pins, updatePin],
  )

  const handleUpdateTimecode = useCallback(
    (id: string, newTimecode: string) => {
      const target = pins.find((p) => p.id === id)
      if (target) {
        updatePin({
          ...target,
          timecode: newTimecode,
          updatedAt: new Date().toISOString(),
        })
      }
    },
    [pins, updatePin],
  )

  const handleUpdateRating = useCallback(
    (id: string, newRating: number) => {
      const target = pins.find((p) => p.id === id)
      if (target) {
        updatePin({
          ...target,
          rating: newRating > 0 ? newRating : undefined,
          updatedAt: new Date().toISOString(),
        })
      }
    },
    [pins, updatePin],
  )

  // Multi-part playlist toggle
  const handleTogglePart = useCallback(
    (pinId: string, partId: string) => {
      const target = pins.find((p) => p.id === pinId)
      if (target && target.parts) {
        const updatedParts = target.parts.map((pt) =>
          pt.id === partId ? { ...pt, isCompleted: !pt.isCompleted } : pt,
        )
        const updatedPin = {
          ...target,
          parts: updatedParts,
          updatedAt: new Date().toISOString(),
        }
        updatePin(updatedPin)
        if (activePlayerPin && activePlayerPin.id === pinId) {
          setActivePlayerPin(updatedPin)
        }
      }
    },
    [pins, updatePin, activePlayerPin],
  )

  const handlePlayPart = useCallback(
    (pin: Pin, part: PlaylistPart) => {
      setActivePlayerPin({
        ...pin,
        url: part.url,
        timecode: part.timecode || pin.timecode,
      })
    },
    [],
  )

  // Batch Add handler
  const handleAddBatch = (batchPins: Pin[]) => {
    batchPins.forEach((p) => addPin(p))
  }

  // Global Keyboard Shortcuts (Ctrl+V, N, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Ctrl+K / Cmd+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowCommandPalette((prev) => !prev)
        return
      }

      // N -> New Pin modal (when not inside inputs)
      if (!isInput && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setInitialPasteUrl('')
        setShowAddModal(true)
        return
      }
    }

    const handleWindowPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (!isInput) {
        const text = e.clipboardData?.getData('text')
        if (text && /^https?:\/\//i.test(text.trim())) {
          e.preventDefault()
          setInitialPasteUrl(text.trim())
          setShowAddModal(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handleWindowPaste)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handleWindowPaste)
    }
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-x-hidden selection:bg-[#ff2a85]/30 selection:text-[#f3e5ab]"
      style={{
        backgroundColor: '#060609',
        color: 'rgba(255, 255, 255, 0.88)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Custom Background Image Overlay from IndexedDB */}
      {customBgUrl && (
        <>
          <div
            className="custom-bg-overlay"
            style={{
              backgroundImage: `url(${customBgUrl})`,
              filter: `blur(${settings.blurAmount}px)`,
              transform: 'scale(1.05)',
            }}
          />
          <div
            className="custom-bg-dim"
            style={{ opacity: settings.dimAmount / 100 }}
          />
        </>
      )}

      {/* Floating Neon Spots in Background */}
      <div className="ambient-bg" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-[#f3e5ab]/[0.05] via-[#ff2a85]/[0.04] to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-16 right-10 w-[480px] h-[320px] bg-[#a855f7]/[0.04] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Main UI layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          currentPreset={settings.preset}
          onOpenTheme={() => setShowThemeModal(true)}
          onOpenAdd={() => {
            setInitialPasteUrl('')
            setShowAddModal(true)
          }}
          onOpenCommand={() => setShowCommandPalette(true)}
          onOpenRoulette={() => setShowRouletteModal(true)}
          onOpenTrash={() => setShowTrashModal(true)}
          onOpenExport={() => setShowExportModal(true)}
          totalPinsCount={allActivePins.length}
          deletedPinsCount={trash.length}
          isPomodoroRunning={pomodoro.running}
          pomodoroDisplay={pomodoro.display}
          pomodoroPhase={pomodoro.phase}
          onPomodoroStart={pomodoro.start}
          onPomodoroPause={pomodoro.pause}
          onPomodoroReset={pomodoro.reset}
          onSelectPomodoroPreset={handleSelectPomodoroPreset}
          currentWorkMin={workMin}
        />

        {/* Browser Quick Dock */}
        <QuickDock
          links={quickLinks}
          onAdd={handleAddQuickLink}
          onRemove={handleRemoveQuickLink}
        />

        {/* Main Content Area */}
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 pb-10 flex-1">
          {/* Dynamic Pin Grid & Navigation */}
          <PinGrid
            pins={displayPins}
            allActivePins={allActivePins}
            collections={collections}
            category={category}
            onCategoryChange={setCategory}
            onOpenAddCollection={() => {
              setEditingCollection(null)
              setShowCollectionModal(true)
            }}
            onOpenEditCollection={(col) => {
              setEditingCollection(col)
              setShowCollectionModal(true)
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            onPlayPin={(p) => setActivePlayerPin(p)}
            onTogglePin={handleTogglePin}
            onDeletePin={softDelete}
            onUpdateStatus={handleUpdateStatus}
            onUpdateEpisode={handleUpdateEpisode}
            onUpdateTimecode={handleUpdateTimecode}
            onUpdateRating={handleUpdateRating}
            onTogglePart={handleTogglePart}
            onPlayPart={handlePlayPart}
            onMoveUp={movePinUp}
            onMoveDown={movePinDown}
            onOpenAddModal={() => {
              setInitialPasteUrl('')
              setShowAddModal(true)
            }}
          />
        </main>

        {/* Minimal Editorial Footer */}
        <footer className="w-full border-t border-white/[0.06] py-5 px-4 text-center text-xs text-white/30 space-y-1 mt-auto">
          <div
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            champagne&amp;pills • Late-Night Lounge &amp; Media Hub
          </div>
          <div className="text-[11px] text-white/20">
            Горячие клавиши: <kbd className="text-white/40">Ctrl+V</kbd> — вставка ссылки, <kbd className="text-white/40">N</kbd> — новый закреп, <kbd className="text-white/40">Ctrl+K</kbd> — команды
          </div>
        </footer>
      </div>

      {/* ── Modals & Overlays ── */}

      {/* Add / Edit Pin Modal (Single, Batch list, Multi-part Playlist) */}
      <AddPinModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setInitialPasteUrl('')
        }}
        onAdd={addPin}
        onAddBatch={handleAddBatch}
        initialUrl={initialPasteUrl}
        collections={collections}
        onOpenAddCollection={() => {
          setShowAddModal(false)
          setEditingCollection(null)
          setShowCollectionModal(true)
        }}
        activeCategory={category}
      />

      {/* Collection Modal (Create / Edit custom sections) */}
      <CollectionModal
        open={showCollectionModal}
        onClose={() => {
          setShowCollectionModal(false)
          setEditingCollection(null)
        }}
        onSave={handleSaveCollection}
        onDelete={handleDeleteCollection}
        initialCollection={editingCollection}
      />

      {/* Split-Screen Cinema & Notes Player Modal */}
      <PlayerModal
        pin={activePlayerPin}
        open={Boolean(activePlayerPin)}
        onClose={() => setActivePlayerPin(null)}
        onUpdatePin={(updated) => {
          updatePin(updated)
          setActivePlayerPin(updated)
        }}
      />

      {/* Atmosphere / Theme Modal */}
      <ThemeModal
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        settings={settings}
        onSetPreset={setPreset}
        onSetCustomBg={setCustomBg}
        onSetDim={setDim}
        onSetBlur={setBlur}
      />

      {/* Pomodoro Focus & Noise Modal */}
      <PomodoroModal
        open={showPomodoroModal}
        onClose={() => setShowPomodoroModal(false)}
        display={pomodoro.display}
        phase={pomodoro.phase}
        running={pomodoro.running}
        onStart={pomodoro.start}
        onPause={pomodoro.pause}
        onReset={pomodoro.reset}
        onSelectPreset={handleSelectPomodoroPreset}
        currentWorkMin={workMin}
      />

      {/* Roulette Modal */}
      <RouletteModal
        open={showRouletteModal}
        onClose={() => setShowRouletteModal(false)}
        pins={pins}
        onPlayPin={(p) => setActivePlayerPin(p)}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        pins={pins}
        quickLinks={quickLinks}
        onSelectPin={(p) => setActivePlayerPin(p)}
        onOpenAdd={() => {
          setInitialPasteUrl('')
          setShowAddModal(true)
        }}
        onOpenTheme={() => setShowThemeModal(true)}
        onOpenPomodoro={() => setShowPomodoroModal(true)}
        onOpenRoulette={() => setShowRouletteModal(true)}
        onOpenTrash={() => setShowTrashModal(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      {/* Trash Modal */}
      <TrashModal
        open={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        pins={trash}
        onRestore={restoreFromTrash}
        onHardDelete={hardDelete}
        onEmptyTrash={emptyTrash}
      />

      {/* Export / Import Modal */}
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        pins={pins}
        quickLinks={quickLinks}
        collections={collections}
        onImportSuccess={(imported) => {
          sync(imported.pins)
          if (imported.quickLinks) {
            setQuickLinks(imported.quickLinks)
            saveQuickLinks(imported.quickLinks)
          }
          if (imported.collections) {
            setCollections(imported.collections)
            saveCollections(imported.collections)
          }
        }}
      />

      {/* Toast Undo for Soft Delete */}
      <ToastUndo
        queue={undoQueue}
        onUndo={undoDelete}
        onDismiss={(id) => undoDelete(id)}
      />
    </div>
  )
}
