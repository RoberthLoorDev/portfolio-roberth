// Converts PNG/JPG images to WebP so pages load fast without visible quality loss.
//
//   npm run images                      -> converts public/details/*.{png,jpg,jpeg}, keeps the originals
//   npm run images -- --replace         -> same, and deletes each original after converting it
//   npm run images -- some/dir          -> another folder
//   options: --quality 94  --max-width 2400  --min-psnr 42  --bg 090C1A  --force (redo existing .webp)
//
// Each image is encoded as high-quality lossy WebP and compared with the original (as a visitor
// sees it, over the page background). Lossy WebP stores color at half resolution, which can blur
// tiny colored text in dense screenshots; if the similarity drops below --min-psnr the image is
// saved as lossless WebP instead, so quality is guaranteed rather than assumed.
// Images wider than --max-width are scaled down, never up. A WebP is only kept if it is smaller.
import { readdir, rm, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name, fallback) => {
     const i = args.indexOf(`--${name}`)
     return i >= 0 ? args[i + 1] : fallback
}
const dir =
     args.find(
          (a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')),
     ) ?? 'public/details'
const quality = Number(option('quality', 94))
const maxWidth = Number(option('max-width', 2400))
const minPsnr = Number(option('min-psnr', 42))
const bgHex = option('bg', '090C1A')
const background = {
     r: parseInt(bgHex.slice(0, 2), 16),
     g: parseInt(bgHex.slice(2, 4), 16),
     b: parseInt(bgHex.slice(4, 6), 16),
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`
const exists = (path) =>
     stat(path).then(
          () => true,
          () => false,
     )

/** Pixels exactly as displayed: transparency composited over the page background. */
const visible = (input) =>
     sharp(input)
          .flatten({ background })
          .removeAlpha()
          .toColourspace('srgb')
          .raw()
          .toBuffer({ resolveWithObject: true })

/** Peak signal-to-noise ratio in dB: above ~40 is visually indistinguishable. */
async function psnr(reference, encoded) {
     const a = await visible(await reference.clone().png().toBuffer())
     const b = await visible(encoded)
     let squaredError = 0
     for (let i = 0; i < a.data.length; i++) {
          const d = a.data[i] - b.data[i]
          squaredError += d * d
     }
     const mse = squaredError / a.data.length
     return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse)
}

let before = 0
let after = 0
let converted = 0

for (const file of (await readdir(dir)).sort()) {
     const ext = extname(file).toLowerCase()
     if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue

     const input = join(dir, file)
     const output = join(dir, `${basename(file, extname(file))}.webp`)
     if ((await exists(output)) && !flag('force')) {
          console.log(`skip     ${file} (already has a .webp, use --force to redo)`)
          continue
     }

     const originalSize = (await stat(input)).size
     const base = sharp(input).resize({ width: maxWidth, withoutEnlargement: true })

     let encoded = await base
          .clone()
          .webp({ quality, smartSubsample: true, alphaQuality: 100, effort: 6 })
          .toBuffer()
     let mode = `q${quality}`
     let score = await psnr(base, encoded)

     if (score < minPsnr) {
          encoded = await base.clone().webp({ lossless: true, effort: 6 }).toBuffer()
          mode = 'lossless'
          score = Infinity
     }

     if (encoded.length >= originalSize) {
          console.log(`keep     ${file} (WebP would not be smaller)`)
          continue
     }

     await writeFile(output, encoded)
     before += originalSize
     after += encoded.length
     converted++
     const quality_ = score === Infinity ? 'exact' : `${score.toFixed(1)} dB`
     console.log(
          `${file.padEnd(28)} ${kb(originalSize).padStart(8)} -> ${kb(encoded.length).padStart(7)}  (${Math.round((encoded.length / originalSize) * 100)}%)  ${mode.padEnd(8)} ${quality_}`,
     )

     if (flag('replace')) await rm(input)
}

if (converted > 0) {
     console.log(
          `\n${converted} images: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB (${Math.round((1 - after / before) * 100)}% smaller)`,
     )
     if (flag('replace'))
          console.log('Originals deleted (recover them from git if needed).')
} else {
     console.log(`Nothing to convert in ${dir}`)
}
