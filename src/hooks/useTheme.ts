import { useState, useEffect, useCallback } from 'react'
import type { ThemePreset, ThemeSettings } from '../types'

const KEY = 'cp_theme'

const DEFAULTS: ThemeSettings = { preset: 'champagne', dimAmount: 65, blurAmount: 12 }

export const PRESET_DATA: Record<ThemePreset, {
  label: string; emoji: string
  g1: string; g2: string; accent: string
}> = {
  champagne: { label: 'Champagne & Rose', emoji: '🥂', g1: 'rgba(243,229,171,0.13)', g2: 'rgba(255,42,133,0.14)', accent: '#f3e5ab' },
  cyber:     { label: 'Cyber Violet',     emoji: '🔮', g1: 'rgba(99,102,241,0.14)',  g2: 'rgba(217,70,239,0.15)', accent: '#c084fc' },
  emerald:   { label: 'Emerald Noir',     emoji: '🌿', g1: 'rgba(0,212,164,0.14)',   g2: 'rgba(16,185,129,0.12)', accent: '#34d399' },
  crimson:   { label: 'Crimson Velvet',    emoji: '🍷', g1: 'rgba(220,38,38,0.14)',   g2: 'rgba(190,18,60,0.12)',  accent: '#fb7185' },
}

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try { const r = localStorage.getItem(KEY); return r ? { ...DEFAULTS, ...JSON.parse(r) } : DEFAULTS } catch { return DEFAULTS }
  })

  useEffect(() => {
    const { preset } = settings
    const { g1, g2, accent } = PRESET_DATA[preset]
    const root = document.documentElement.style
    root.setProperty('--g1', g1)
    root.setProperty('--g2', g2)
    root.setProperty('--accent', accent)
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  const setPreset = useCallback((preset: ThemePreset) => setSettings(s => ({ ...s, preset })), [])
  const setCustomBg = useCallback((key?: string) => setSettings(s => ({ ...s, customBgDbKey: key })), [])
  const setDim = useCallback((dimAmount: number) => setSettings(s => ({ ...s, dimAmount })), [])
  const setBlur = useCallback((blurAmount: number) => setSettings(s => ({ ...s, blurAmount })), [])

  return { settings, setPreset, setCustomBg, setDim, setBlur }
}
