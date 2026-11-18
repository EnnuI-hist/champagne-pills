const DB_NAME = 'champagne_pills_db'
const DB_VERSION = 1
const IMG_STORE = 'images'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IMG_STORE)) {
        db.createObjectStore(IMG_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveImage(key: string, blob: Blob): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMG_STORE, 'readwrite')
    tx.objectStore(IMG_STORE).put(blob, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getImage(key: string): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMG_STORE, 'readonly')
    const req = tx.objectStore(IMG_STORE).get(key)
    req.onsuccess = () => {
      if (req.result instanceof Blob) {
        resolve(URL.createObjectURL(req.result))
      } else {
        resolve(null)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteImage(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMG_STORE, 'readwrite')
    tx.objectStore(IMG_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Compress an image File/Blob to WebP ≤900px wide, return Blob */
export async function compressImage(input: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(input)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_W = 900
      let w = img.width, h = img.height
      if (w > MAX_W) { h = Math.round(h * (MAX_W / w)); w = MAX_W }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => resolve(blob || input),
        'image/webp',
        0.82,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(input) }
    img.src = url
  })
}
