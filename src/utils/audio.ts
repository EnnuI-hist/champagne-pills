import type { NoiseType } from '../types'

let audioCtx: AudioContext | null = null
let noiseNode: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let currentType: NoiseType = 'silent'

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function createBrownNoise(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 4 // 4s looping buffer
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return buf
}

function createRainNoise(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 6
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.015 * white) / 1.015
    // amplitude modulation for rain-like patter
    const mod = 0.4 + 0.6 * Math.abs(Math.sin(i / (ctx.sampleRate * 0.08)))
    data[i] = last * 2.8 * mod
  }
  return buf
}

export function startNoise(type: NoiseType, volume: number): void {
  stopNoise()
  if (type === 'silent') return
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()

  const buffer = type === 'brown' ? createBrownNoise(ctx) : createRainNoise(ctx)
  noiseNode = ctx.createBufferSource()
  noiseNode.buffer = buffer
  noiseNode.loop = true

  gainNode = ctx.createGain()
  gainNode.gain.value = volume
  noiseNode.connect(gainNode).connect(ctx.destination)
  noiseNode.start()
  currentType = type
}

export function stopNoise(): void {
  try { noiseNode?.stop() } catch { /* already stopped */ }
  noiseNode?.disconnect()
  gainNode?.disconnect()
  noiseNode = null
  gainNode = null
  currentType = 'silent'
}

export function setNoiseVolume(v: number): void {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, v))
}

export function getCurrentNoiseType(): NoiseType { return currentType }

/**
 * Procedural gentle chime sound for Pomodoro phase completion
 */
export function playChime(): void {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    // Pleasant dual-tone bell (587.33 Hz D5 + 880 Hz A5)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18)

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, now)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.2)
    osc2.stop(now + 1.2)
  } catch {
    // Graceful fallback if AudioContext is not yet unlocked
  }
}
