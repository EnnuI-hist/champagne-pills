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
