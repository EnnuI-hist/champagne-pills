import { useState, useEffect, useCallback, useRef } from 'react'

export type PomodoroPhase = 'work' | 'break' | 'idle'

export function usePomodoro(workMin = 45, breakMin = 10) {
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60)
  const [running, setRunning] = useState(false)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        // phase switch
        setPhase(ph => {
          if (ph === 'work') {
            setSecondsLeft(breakMin * 60)
            try { new Notification('champagne&pills', { body: '☕ Перерыв!' }) } catch {}
            return 'break'
          }
          setSecondsLeft(workMin * 60)
          try { new Notification('champagne&pills', { body: '📚 Пора работать!' }) } catch {}
          return 'work'
        })
        return breakMin * 60 // fallback, will be overwritten
      }
      return prev - 1
    })
  }, [workMin, breakMin])

  useEffect(() => {
    if (running) {
      interval.current = setInterval(tick, 1000)
    } else if (interval.current) {
      clearInterval(interval.current)
    }
    return () => { if (interval.current) clearInterval(interval.current) }
  }, [running, tick])

  const start = useCallback(() => {
    if (phase === 'idle') { setPhase('work'); setSecondsLeft(workMin * 60) }
    setRunning(true)
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [phase, workMin])

  const pause = useCallback(() => setRunning(false), [])

  const reset = useCallback(() => {
    setRunning(false); setPhase('idle'); setSecondsLeft(workMin * 60)
  }, [workMin])

  const display = `${String(Math.floor(secondsLeft / 60)).padStart(2,'0')}:${String(secondsLeft % 60).padStart(2,'0')}`

  return { phase, running, secondsLeft, display, start, pause, reset }
}
