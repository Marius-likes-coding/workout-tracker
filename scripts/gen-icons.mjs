// Generates the app's PWA PNG icons procedurally (no native deps).
// Draws a simple dumbbell on a dark background. Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const BG = [15, 23, 42] // slate-900
const FG = [56, 189, 248] // sky-400

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return (~c) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // raw scanlines, each prefixed with filter byte 0
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4)
    raw[rowStart] = 0
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      const dst = rowStart + 1 + x * 4
      raw[dst] = rgba[src]
      raw[dst + 1] = rgba[src + 1]
      raw[dst + 2] = rgba[src + 2]
      raw[dst + 3] = rgba[src + 3]
    }
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Returns RGBA pixel array for an NxN dumbbell icon.
function draw(N, { rounded = false } = {}) {
  const px = new Uint8Array(N * N * 4)
  const rectMask = [] // {x0,x1,y0,y1} in fractional coords
  // handle bar
  rectMask.push([0.3, 0.7, 0.455, 0.545])
  // inner plates
  rectMask.push([0.24, 0.305, 0.37, 0.63])
  rectMask.push([0.695, 0.76, 0.37, 0.63])
  // outer plates
  rectMask.push([0.18, 0.245, 0.31, 0.69])
  rectMask.push([0.755, 0.82, 0.31, 0.69])

  const radius = rounded ? N * 0.18 : 0
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      // optional rounded-corner transparency (for non-maskable icons)
      let alpha = 255
      if (rounded) {
        const corners = [
          [radius, radius],
          [N - radius, radius],
          [radius, N - radius],
          [N - radius, N - radius],
        ]
        for (const [cx, cy] of corners) {
          const insideCornerBox =
            (x < radius || x > N - radius) && (y < radius || y > N - radius)
          if (insideCornerBox) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > radius) alpha = 0
          }
        }
      }
      let col = BG
      const fx = x / N
      const fy = y / N
      for (const [x0, x1, y0, y1] of rectMask) {
        if (fx >= x0 && fx <= x1 && fy >= y0 && fy <= y1) {
          col = FG
          break
        }
      }
      px[i] = col[0]
      px[i + 1] = col[1]
      px[i + 2] = col[2]
      px[i + 3] = alpha
    }
  }
  return px
}

function out(path, buf) {
  const full = resolve(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, buf)
  console.log('wrote', path, `(${buf.length} bytes)`)
}

out('public/icons/icon-192.png', encodePng(192, 192, draw(192, { rounded: true })))
out('public/icons/icon-512.png', encodePng(512, 512, draw(512, { rounded: true })))
// maskable: full-bleed background (no rounded transparency) so OS masks it cleanly
out('public/icons/maskable-512.png', encodePng(512, 512, draw(512, { rounded: false })))
out('public/apple-touch-icon.png', encodePng(180, 180, draw(180, { rounded: false })))
