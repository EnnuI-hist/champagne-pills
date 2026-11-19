import { useState, useEffect, useCallback } from 'react'
import type { Pin, Category, Status, StatusFilter, QuickLink } from '../types'
import { loadPins, savePins, getDemoData, loadQuickLinks, saveQuickLinks } from '../utils/storage'

/* ───── Undo delete queue ───── */
interface UndoItem { pin: Pin; timeout: ReturnType<typeof setTimeout> }

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([])
  const [loaded, setLoaded] = useState(false)
  const [undoQueue, setUndoQueue] = useState<UndoItem[]>([])

  useEffect(() => {
    const stored = loadPins()
    if (stored.length === 0) { const demo = getDemoData(); savePins(demo); setPins(demo) }
    else setPins(stored)
    setLoaded(true)
  }, [])

  const sync = useCallback((next: Pin[]) => { setPins(next); savePins(next) }, [])

  const addPin = useCallback((pin: Pin) => {
    setPins(prev => { const n = [pin, ...prev]; savePins(n); return n })
  }, [])

  const updatePin = useCallback((p: Pin) => {
    setPins(prev => { const n = prev.map(x => x.id === p.id ? p : x); savePins(n); return n })
  }, [])

  const softDelete = useCallback((id: string) => {
    setPins(prev => {
      const target = prev.find(p => p.id === id)
      if (!target) return prev
      const deleted = { ...target, status: 'deleted' as Status, isDeleted: true, deletedAt: new Date().toISOString() }
      const n = prev.map(p => p.id === id ? deleted : p)
      savePins(n)
      // undo timer (6s)
      const timer = setTimeout(() => {
        setUndoQueue(q => q.filter(u => u.pin.id !== id))
      }, 6000)
      setUndoQueue(q => [...q, { pin: target, timeout: timer }])
      return n
    })
  }, [])

  const undoDelete = useCallback((id: string) => {
    const item = undoQueue.find(u => u.pin.id === id)
    if (!item) return
    clearTimeout(item.timeout)
    setUndoQueue(q => q.filter(u => u.pin.id !== id))
    const restoredPin = { ...item.pin, isDeleted: false, status: item.pin.status === 'deleted' ? ('queued' as Status) : item.pin.status }
    setPins(prev => { const n = prev.map(p => p.id === id ? restoredPin : p); savePins(n); return n })
  }, [undoQueue])

  const hardDelete = useCallback((id: string) => {
    setPins(prev => { const n = prev.filter(p => p.id !== id); savePins(n); return n })
  }, [])

  const restoreFromTrash = useCallback((id: string) => {
    setPins(prev => {
      const n = prev.map(p => p.id === id ? { ...p, status: 'queued' as Status, isDeleted: false, deletedAt: undefined } : p)
      savePins(n); return n
    })
  }, [])

  const emptyTrash = useCallback(() => {
    setPins(prev => { const n = prev.filter(p => p.status !== 'deleted'); savePins(n); return n })
  }, [])

  const clearDemo = useCallback(() => {
    setPins(prev => { const n = prev.filter(p => !p.isDemo); savePins(n); return n })
  }, [])

  const moveToTop = useCallback((id: string) => {
    setPins(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx <= 0) return prev
      const n = [...prev]; const [item] = n.splice(idx, 1); n.unshift(item)
      savePins(n); return n
    })
  }, [])

  const movePinUp = useCallback((id: string) => {
    setPins(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx <= 0) return prev
      const n = [...prev]
      const [item] = n.splice(idx, 1)
      n.splice(idx - 1, 0, item)
      savePins(n)
      return n
    })
  }, [])

  const movePinDown = useCallback((id: string) => {
    setPins(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const n = [...prev]
      const [item] = n.splice(idx, 1)
      n.splice(idx + 1, 0, item)
      savePins(n)
      return n
    })
  }, [])

  return {
    pins, loaded, addPin, updatePin, softDelete, hardDelete, undoDelete,
    restoreFromTrash, emptyTrash, clearDemo, moveToTop, movePinUp, movePinDown, sync, undoQueue,
  }
}

/* ───── Filtered pins ───── */
export function useFilteredPins(
  pins: Pin[], category: Category, search: string,
  statusFilter: StatusFilter, tag?: string,
) {
  const active = pins.filter(p => p.status !== 'deleted')
  const filtered = active.filter(pin => {
    if (category !== 'all' && pin.category !== category) return false
    if (statusFilter !== 'all') {
      if (statusFilter === 'archive') {
        if (pin.status !== 'completed' && pin.status !== 'archived') return false
      } else if (pin.status !== statusFilter) {
        return false
      }
    }
    if (tag && !(pin.tags || []).includes(tag)) return false
    if (search) {
      const q = search.toLowerCase()
      const haystack = `${pin.title} ${pin.note || ''} ${pin.notes || ''} ${(pin.tags || []).join(' ')} ${pin.channelName || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
  const pinned = filtered.filter(p => p.isPinned && p.status === 'watching')
  const rest = filtered.filter(p => !(p.isPinned && p.status === 'watching'))
  const trash = pins.filter(p => p.status === 'deleted')
  return { filtered, pinned, rest, trash, totalActive: active.length }
}

/* ───── Quick Dock ───── */
export function useQuickDock() {
  const [links, setLinks] = useState<QuickLink[]>([])
  useEffect(() => { setLinks(loadQuickLinks()) }, [])
  const add = useCallback((link: QuickLink) => {
    setLinks(prev => { const n = [...prev, link]; saveQuickLinks(n); return n })
  }, [])
  const remove = useCallback((id: string) => {
    setLinks(prev => { const n = prev.filter(l => l.id !== id); saveQuickLinks(n); return n })
  }, [])
  return { links, add, remove }
}
