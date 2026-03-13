const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SRC_SIZE = 512;

function renderSource() {
  const s = SRC_SIZE;
  const pixels = new Float32Array(s * s * 4);

  function blendPixel(x, y, r, g, b, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= s || y < 0 || y >= s) return;
    const idx = (y * s + x) * 4;
    const srcA = a / 255;
    const dstA = pixels[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0) return;
    pixels[idx] = (r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA;
    pixels[idx + 1] = (g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA;
    pixels[idx + 2] = (b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA;
    pixels[idx + 3] = outA * 255;
  }

  function sdf_roundedRect(px, py, x, y, w, h, rad) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const hw = w / 2 - rad;
    const hh = h / 2 - rad;
    const dx = Math.max(0, Math.abs(px - cx) - hw);
    const dy = Math.max(0, Math.abs(py - cy) - hh);
    return Math.sqrt(dx * dx + dy * dy) - rad;
  }

  function sdf_circle(px, py, cx, cy, radius) {
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)) - radius;
  }

  function sdf_line(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - x0) * (px - x0) + (py - y0) * (py - y0));
    const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
    const projX = x0 + t * dx;
    const projY = y0 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  const AA = 1.2;

  // Background
  const bgR = s * 0.18;

  // Magnifying glass - centered
  const glassCx = s * 0.44;
  const glassCy = s * 0.44;
  const glassR = s * 0.24;
  const stroke = s * 0.05;

  // Handle
  const hAngle = Math.PI / 4;
  const hStart = glassR + stroke * 0.4;
  const hLen = s * 0.22;
  const hx0 = glassCx + hStart * Math.cos(hAngle);
  const hy0 = glassCy + hStart * Math.sin(hAngle);
  const hx1 = glassCx + (hStart + hLen) * Math.cos(hAngle);
  const hy1 = glassCy + (hStart + hLen) * Math.sin(hAngle);
  const handleW = stroke * 0.6;

  // "T" letter inside the glass
  const tCx = glassCx;
  const tCy = glassCy + s * 0.01;
  const tTopW = s * 0.16;       // horizontal bar width
  const tTopH = stroke * 0.75;  // horizontal bar height
  const tStemW = stroke * 0.75; // vertical stem width
  const tStemH = s * 0.16;      // vertical stem height
  const tTopY = tCy - tStemH * 0.5;

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const px = x + 0.5;
      const py = y + 0.5;

      // === 1. Dark rounded square background ===
      const bgDist = sdf_roundedRect(px, py, 0, 0, s, s, bgR);
      const bgAlpha = Math.max(0, Math.min(1, 0.5 - bgDist / AA));
      if (bgAlpha > 0) {
        blendPixel(x, y, 20, 20, 22, bgAlpha * 255);
      }
      if (bgAlpha <= 0) continue;

      // === 2. Magnifying glass ring (white thick stroke) ===
      const ringDist = Math.abs(sdf_circle(px, py, glassCx, glassCy, glassR)) - stroke / 2;
      const ringAlpha = Math.max(0, Math.min(1, 0.5 - ringDist / AA));
      if (ringAlpha > 0) {
        blendPixel(x, y, 255, 255, 255, ringAlpha * 255);
      }

      // === 3. Handle (white thick line) ===
      const lineDist = sdf_line(px, py, hx0, hy0, hx1, hy1) - handleW;
      const lineAlpha = Math.max(0, Math.min(1, 0.5 - lineDist / AA));
      if (lineAlpha > 0) {
        blendPixel(x, y, 255, 255, 255, lineAlpha * 255);
      }

      // === 4. Handle end cap (rounded) ===
      const capDist = sdf_circle(px, py, hx1, hy1, handleW);
      const capAlpha = Math.max(0, Math.min(1, 0.5 - capDist / AA));
      if (capAlpha > 0) {
        blendPixel(x, y, 255, 255, 255, capAlpha * 255);
      }

      // === 5. "T" letter - light gray, bold ===
      // Top bar of T
      const tTopDist = sdf_roundedRect(px, py,
        tCx - tTopW / 2, tTopY,
        tTopW, tTopH, tTopH * 0.3);
      const tTopAlpha = Math.max(0, Math.min(1, 0.5 - tTopDist / AA));

      // Stem of T
      const tStemDist = sdf_roundedRect(px, py,
        tCx - tStemW / 2, tTopY + tTopH * 0.3,
        tStemW, tStemH, tStemW * 0.25);
      const tStemAlpha = Math.max(0, Math.min(1, 0.5 - tStemDist / AA));

      const tAlpha = Math.max(tTopAlpha, tStemAlpha);
      if (tAlpha > 0) {
        blendPixel(x, y, 200, 200, 205, tAlpha * 255); // light gray #C8C8CD
      }
    }
  }

  return pixels;
}

// --- Downscale ---

function downscale(src, srcSize, dstSize) {
  const dst = Buffer.alloc(dstSize * dstSize * 4);
  const scale = srcSize / dstSize;

  for (let dy = 0; dy < dstSize; dy++) {
    for (let dx = 0; dx < dstSize; dx++) {
      const sx0 = dx * scale;
      const sy0 = dy * scale;
      const sx1 = sx0 + scale;
      const sy1 = sy0 + scale;

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      const ixStart = Math.floor(sx0);
      const ixEnd = Math.min(srcSize - 1, Math.ceil(sx1));
      const iyStart = Math.floor(sy0);
      const iyEnd = Math.min(srcSize - 1, Math.ceil(sy1));

      for (let iy = iyStart; iy <= iyEnd; iy++) {
        for (let ix = ixStart; ix <= ixEnd; ix++) {
          const overlapX = Math.min(ix + 1, sx1) - Math.max(ix, sx0);
          const overlapY = Math.min(iy + 1, sy1) - Math.max(iy, sy0);
          const w = Math.max(0, overlapX) * Math.max(0, overlapY);
          if (w > 0) {
            const idx = (iy * srcSize + ix) * 4;
            rSum += src[idx] * w;
            gSum += src[idx + 1] * w;
            bSum += src[idx + 2] * w;
            aSum += src[idx + 3] * w;
            count += w;
          }
        }
      }

      const dIdx = (dy * dstSize + dx) * 4;
      if (count > 0) {
        dst[dIdx] = Math.round(rSum / count);
        dst[dIdx + 1] = Math.round(gSum / count);
        dst[dIdx + 2] = Math.round(bSum / count);
        dst[dIdx + 3] = Math.round(aSum / count);
      }
    }
  }

  return dst;
}

// --- PNG encoding ---

function encodePng(pixels, size) {
  const rawData = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) * 4;
      const dstIdx = y * (size * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const chunks = [];
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  function writeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = crc32(typeData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0);
    chunks.push(len, typeData, crcBuf);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  writeChunk("IHDR", ihdr);
  writeChunk("IDAT", compressed);
  writeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat(chunks);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// --- Main ---

console.log("Rendering at " + SRC_SIZE + "x" + SRC_SIZE + "...");
const source = renderSource();

const iconsDir = path.join(__dirname, "..", "src", "icons");

// Save preview
const previewPng = encodePng(source, SRC_SIZE);
fs.writeFileSync(path.join(iconsDir, "icon-preview.png"), previewPng);
console.log("  icon-preview.png (512x512)");

for (const size of [16, 48, 128]) {
  const scaled = downscale(source, SRC_SIZE, size);
  const png = encodePng(scaled, size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`  icon${size}.png`);
}

console.log("Done.");
