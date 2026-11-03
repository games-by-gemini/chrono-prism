import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { SECTORS } from "../.arcadible-public/main.js";

// CRC32 table for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter type 0
    const srcStart = y * width * 4;
    raw.set(rgba.subarray(srcStart, srcStart + width * 4), rowStart + 1);
  }
  const compressed = zlib.deflateSync(raw, { level: 4 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// 2D Software Canvas Helper for Crisp Geometric Art & Screenshots
class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }

  fillBackground(r1, g1, b1, r2, g2, b2) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.48;
    const maxD = Math.hypot(cx, cy);
    let idx = 0;
    for (let y = 0; y < this.h; y++) {
      const dy = y - cy;
      for (let x = 0; x < this.w; x++) {
        const dx = x - cx;
        const t = Math.min(1, Math.hypot(dx, dy) / maxD);
        this.data[idx] = Math.round(r1 + (r2 - r1) * t);
        this.data[idx + 1] = Math.round(g1 + (g2 - g1) * t);
        this.data[idx + 2] = Math.round(b1 + (b2 - b1) * t);
        this.data[idx + 3] = 255;
        idx += 4;
      }
    }
  }

  blendPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h || a <= 0) return;
    const idx = (y * this.w + x) * 4;
    const alpha = Math.min(1, a);
    const inv = 1 - alpha;
    this.data[idx] = Math.min(255, Math.round(this.data[idx] * inv + r * alpha));
    this.data[idx + 1] = Math.min(255, Math.round(this.data[idx + 1] * inv + g * alpha));
    this.data[idx + 2] = Math.min(255, Math.round(this.data[idx + 2] * inv + b * alpha));
  }

  addGlowPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h || a <= 0) return;
    const idx = (y * this.w + x) * 4;
    this.data[idx] = Math.min(255, Math.round(this.data[idx] + r * a));
    this.data[idx + 1] = Math.min(255, Math.round(this.data[idx + 1] + g * a));
    this.data[idx + 2] = Math.min(255, Math.round(this.data[idx + 2] + b * a));
  }

  drawRect(x0, y0, w, h, r, g, b, a = 1) {
    const sx = Math.max(0, Math.floor(x0));
    const sy = Math.max(0, Math.floor(y0));
    const ex = Math.min(this.w, Math.ceil(x0 + w));
    const ey = Math.min(this.h, Math.ceil(y0 + h));
    for (let y = sy; y < ey; y++) {
      for (let x = sx; x < ex; x++) {
        this.blendPixel(x, y, r, g, b, a);
      }
    }
  }

  drawStrokeRect(x0, y0, w, h, thickness, r, g, b, a = 1) {
    this.drawRect(x0, y0, w, thickness, r, g, b, a);
    this.drawRect(x0, y0 + h - thickness, w, thickness, r, g, b, a);
    this.drawRect(x0, y0, thickness, h, r, g, b, a);
    this.drawRect(x0 + w - thickness, y0, thickness, h, r, g, b, a);
  }

  drawCircle(cx, cy, radius, r, g, b, a = 1, glow = false) {
    const rPad = Math.ceil(radius + 2);
    const sx = Math.max(0, Math.floor(cx - rPad));
    const ex = Math.min(this.w - 1, Math.ceil(cx + rPad));
    const sy = Math.max(0, Math.floor(cy - rPad));
    const ey = Math.min(this.h - 1, Math.ceil(cy + rPad));
    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (glow) {
          if (d <= radius) {
            const falloff = Math.pow(1 - d / radius, 1.8);
            this.addGlowPixel(x, y, r, g, b, a * falloff);
          }
        } else if (d <= radius + 0.5) {
          const aa = Math.max(0, Math.min(1, radius + 0.5 - d));
          this.blendPixel(x, y, r, g, b, a * aa);
        }
      }
    }
  }

  drawRing(cx, cy, radius, thickness, r, g, b, a = 1) {
    const outer = radius + thickness * 0.5;
    const inner = radius - thickness * 0.5;
    const sx = Math.max(0, Math.floor(cx - outer - 2));
    const ex = Math.min(this.w - 1, Math.ceil(cx + outer + 2));
    const sy = Math.max(0, Math.floor(cy - outer - 2));
    const ey = Math.min(this.h - 1, Math.ceil(cy + outer + 2));
    for (let y = sy; y <= ey; y++) {
      for (let x = sx; x <= ex; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= inner - 1 && d <= outer + 1) {
          const distFromCenter = Math.abs(d - radius);
          const half = thickness * 0.5;
          const aa = Math.max(0, Math.min(1, half + 0.7 - distFromCenter));
          this.blendPixel(x, y, r, g, b, a * aa);
        }
      }
    }
  }

  drawBeam(x1, y1, x2, y2, coreRadius, glowRadius, r, g, b) {
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - glowRadius));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(x1, x2) + glowRadius));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - glowRadius));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + glowRadius));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
        const px = x1 + t * dx;
        const py = y1 + t * dy;
        const d = Math.hypot(x - px, y - py);
        if (d <= glowRadius) {
          const glowIntensity = Math.pow(1 - d / glowRadius, 2.0) * 0.65;
          this.addGlowPixel(x, y, r, g, b, glowIntensity);
          if (d <= coreRadius) {
            const coreA = Math.max(0, Math.min(1, coreRadius + 0.5 - d));
            this.blendPixel(x, y, 250, 252, 255, coreA * 0.9);
          }
        }
      }
    }
  }

  drawTriangle(x1, y1, x2, y2, x3, y3, r, g, b, fillAlpha, strokeThickness, sr, sg, sb) {
    const minX = Math.max(0, Math.floor(Math.min(x1, x2, x3) - strokeThickness));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(x1, x2, x3) + strokeThickness));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2, y3) - strokeThickness));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2, y3) + strokeThickness));

    const area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
    const sign = area >= 0 ? 1 : -1;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w1 = ((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) * sign;
        const w2 = ((x3 - x2) * (y - y2) - (y3 - y2) * (x - x2)) * sign;
        const w3 = ((x1 - x3) * (y - y3) - (y1 - y3) * (x - x3)) * sign;
        if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
          this.blendPixel(x, y, r, g, b, fillAlpha);
        }
      }
    }
    this.drawBeam(x1, y1, x2, y2, strokeThickness * 0.35, strokeThickness, sr, sg, sb);
    this.drawBeam(x2, y2, x3, y3, strokeThickness * 0.35, strokeThickness, sr, sg, sb);
    this.drawBeam(x3, y3, x1, y1, strokeThickness * 0.35, strokeThickness, sr, sg, sb);
  }

  // Clean 5x7 Block Vector Font for Allowed Title ("CHRONO PRISM") on Cover/Banner/Poster
  drawTitleText(text, centerX, centerY, scale, r, g, b) {
    const glyphs = {
      C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
      H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
      R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
      O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
      N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
      P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
      I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
      S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
      M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
      " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    };
    const charW = 5 * scale;
    const spacing = 2 * scale;
    const totalW = text.length * charW + (text.length - 1) * spacing;
    const startX = Math.round(centerX - totalW / 2);
    const startY = Math.round(centerY - (7 * scale) / 2);

    for (let i = 0; i < text.length; i++) {
      const gMap = glyphs[text[i]];
      if (!gMap) continue;
      const cx = startX + i * (charW + spacing);
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (gMap[row][col] === "1") {
            this.drawRect(cx + col * scale, startY + row * scale, scale, scale, r, g, b, 0.96);
          }
        }
      }
    }
  }
}

function drawPrismMotif(pc, cx, cy, size, includeTitle = false, titleY = 0, titleScale = 8) {
  // Outer harmonic rings (inside safe margin)
  pc.drawCircle(cx, cy, size * 0.95, 34, 211, 238, 0.25, true);
  pc.drawRing(cx, cy, size * 0.72, size * 0.025, 34, 211, 238, 0.55);
  pc.drawRing(cx, cy, size * 0.84, size * 0.015, 244, 63, 94, 0.45);

  // Incoming white laser beam from left
  pc.drawBeam(cx - size * 0.88, cy + size * 0.08, cx - size * 0.18, cy, size * 0.03, size * 0.14, 240, 248, 255);

  // Refracted Cyan, Magenta, Gold beams exiting right
  pc.drawBeam(cx + size * 0.15, cy - size * 0.06, cx + size * 0.88, cy - size * 0.42, size * 0.028, size * 0.13, 34, 211, 238);
  pc.drawBeam(cx + size * 0.18, cy + size * 0.02, cx + size * 0.9, cy + size * 0.02, size * 0.028, size * 0.13, 251, 191, 36);
  pc.drawBeam(cx + size * 0.15, cy + size * 0.1, cx + size * 0.88, cy + size * 0.46, size * 0.028, size * 0.13, 244, 63, 94);

  // Central Equilateral Crystal Prism
  const r = size * 0.48;
  pc.drawTriangle(
    cx,
    cy - r,
    cx + r * 0.88,
    cy + r * 0.68,
    cx - r * 0.88,
    cy + r * 0.68,
    34,
    211,
    238,
    0.22,
    size * 0.055,
    34,
    211,
    238
  );

  // Inner Time-Echo Triangle
  const r2 = size * 0.26;
  pc.drawTriangle(
    cx,
    cy - r2 * 0.8,
    cx + r2 * 0.88,
    cy + r2 * 0.72,
    cx - r2 * 0.88,
    cy + r2 * 0.72,
    244,
    63,
    94,
    0.25,
    size * 0.035,
    244,
    63,
    94
  );

  // Golden Chrono Core
  pc.drawCircle(cx, cy + size * 0.06, size * 0.09, 251, 191, 36, 0.95, false);

  if (includeTitle) {
    pc.drawTitleText("CHRONO PRISM", cx, titleY, titleScale, 248, 250, 252);
  }
}

function renderGameplayScreenshot(w, h, sectorIdx, solvedState) {
  const pc = new PixelCanvas(w, h);
  pc.fillBackground(17, 25, 54, 7, 9, 19);

  const isPortrait = h > w;
  const arenaW = isPortrait ? w * 0.86 : w * 0.8;
  const tile = arenaW / 16;
  const arenaH = tile * 9;
  const ox = (w - arenaW) / 2;
  const oy = (h - arenaH) / 2 + (isPortrait ? 0 : 16);

  // Header bar
  pc.drawRect(w * 0.06, h * 0.04, w * 0.88, isPortrait ? 68 : 54, 15, 23, 42, 0.9);
  pc.drawStrokeRect(w * 0.06, h * 0.04, w * 0.88, isPortrait ? 68 : 54, 2, 34, 211, 238, 0.5);
  pc.drawTitleText("CHRONO PRISM", w * 0.26, h * 0.04 + (isPortrait ? 34 : 27), isPortrait ? 4 : 4, 34, 211, 238);

  // Arena grid
  for (let c = 0; c <= 16; c++) {
    pc.drawRect(ox + c * tile, oy, 1, arenaH, 56, 189, 248, 0.14);
  }
  for (let r = 0; r <= 9; r++) {
    pc.drawRect(ox, oy + r * tile, arenaW, 1, 56, 189, 248, 0.14);
  }
  pc.drawStrokeRect(ox, oy, arenaW, arenaH, 3, 34, 211, 238, 0.45);

  const cellPos = (c, r) => ({
    x: ox + (c + 0.5) * tile,
    y: oy + (r + 0.5) * tile,
  });

  // Draw solved beams for this screenshot
  for (const b of solvedState.beams) {
    const p1 = cellPos(b.c1, b.r1);
    const p2 = cellPos(b.c2, b.r2);
    const col =
      b.color === "magenta"
        ? [244, 63, 94]
        : b.color === "gold"
        ? [251, 191, 36]
        : b.color === "white"
        ? [248, 250, 252]
        : [34, 211, 238];
    pc.drawBeam(p1.x, p1.y, p2.x, p2.y, tile * 0.07, tile * 0.28, col[0], col[1], col[2]);
  }

  // Draw items
  const sector = SECTORS[sectorIdx];
  for (const it of sector.items) {
    const p = cellPos(it.c, it.r);
    if (it.type === "emitter") {
      pc.drawCircle(p.x, p.y, tile * 0.34, 15, 23, 42, 0.95);
      pc.drawRing(p.x, p.y, tile * 0.34, 4, 34, 211, 238, 0.95);
    } else if (it.type === "prism" || it.type === "splitter" || it.type === "chromatic") {
      const col = it.type === "chromatic" ? [244, 63, 94] : it.type === "splitter" ? [192, 132, 252] : [34, 211, 238];
      const rad = tile * 0.34;
      pc.drawTriangle(
        p.x,
        p.y - rad,
        p.x + rad,
        p.y + rad * 0.8,
        p.x - rad,
        p.y + rad * 0.8,
        col[0],
        col[1],
        col[2],
        0.3,
        4,
        col[0],
        col[1],
        col[2]
      );
    } else if (it.type === "resonator") {
      const col =
        it.color === "magenta"
          ? [244, 63, 94]
          : it.color === "gold"
          ? [251, 191, 36]
          : [34, 211, 238];
      pc.drawCircle(p.x, p.y, tile * 0.55, col[0], col[1], col[2], 0.45, true);
      pc.drawRing(p.x, p.y, tile * 0.36, 5, col[0], col[1], col[2], 0.98);
      pc.drawCircle(p.x, p.y, tile * 0.18, 255, 255, 255, 0.95);
    } else if (it.type === "pad" || it.type === "gate") {
      pc.drawRing(p.x, p.y, tile * 0.32, 4, 251, 191, 36, 0.9);
    } else if (it.type === "shifter") {
      pc.drawRing(p.x, p.y, tile * 0.28, 4, 251, 191, 36, 0.95);
    }
  }

  // Draw Time Echoes and Player Core
  for (const ePos of solvedState.echoes) {
    const p = cellPos(ePos.c, ePos.r);
    pc.drawCircle(p.x, p.y, tile * 0.42, 244, 63, 94, 0.4, true);
    pc.drawRing(p.x, p.y, tile * 0.28, 4, 244, 63, 94, 0.95);
  }
  const pl = cellPos(solvedState.player.c, solvedState.player.r);
  pc.drawCircle(pl.x, pl.y, tile * 0.45, 34, 211, 238, 0.45, true);
  pc.drawRing(pl.x, pl.y, tile * 0.3, 4, 248, 250, 252, 0.98);
  pc.drawCircle(pl.x, pl.y, tile * 0.1, 251, 191, 36, 1.0);

  return encodePNG(w, h, pc.data);
}

// Verify all 12 sectors exist and have valid emitters & resonators
if (SECTORS.length !== 12) {
  throw new Error(`Expected 12 sectors, found ${SECTORS.length}`);
}
for (const s of SECTORS) {
  const emitters = s.items.filter((i) => i.type === "emitter");
  const resonators = s.items.filter((i) => i.type === "resonator");
  if (emitters.length === 0 || resonators.length === 0) {
    throw new Error(`Sector ${s.id} missing emitter or resonator`);
  }
}
console.log("Verified all 12 sectors in SECTORS.");

const artDir = path.resolve("/home/agent/game/.arcadible");
const galDir = path.resolve("/home/agent/game/.arcadible/gallery");
fs.mkdirSync(galDir, { recursive: true });

// 1. icon.png (1024 x 1024, 1:1, no text, inside 102px margin)
{
  const pc = new PixelCanvas(1024, 1024);
  pc.fillBackground(19, 28, 62, 7, 9, 19);
  drawPrismMotif(pc, 512, 512, 360, false);
  fs.writeFileSync(path.join(artDir, "icon.png"), encodePNG(1024, 1024, pc.data));
}

// 2. cover.png (1536 x 1024, 3:2, title inside 102px margin)
{
  const pc = new PixelCanvas(1536, 1024);
  pc.fillBackground(19, 28, 62, 7, 9, 19);
  drawPrismMotif(pc, 768, 450, 310, true, 850, 10);
  fs.writeFileSync(path.join(artDir, "cover.png"), encodePNG(1536, 1024, pc.data));
}

// 3. banner.png (2048 x 1024, 2:1, title inside 102px margin)
{
  const pc = new PixelCanvas(2048, 1024);
  pc.fillBackground(19, 28, 62, 7, 9, 19);
  drawPrismMotif(pc, 1024, 440, 320, true, 850, 11);
  fs.writeFileSync(path.join(artDir, "banner.png"), encodePNG(2048, 1024, pc.data));
}

// 4. poster.png (1024 x 1536, 2:3, title inside 102px margin)
{
  const pc = new PixelCanvas(1024, 1536);
  pc.fillBackground(19, 28, 62, 7, 9, 19);
  drawPrismMotif(pc, 512, 680, 350, true, 1240, 9);
  fs.writeFileSync(path.join(artDir, "poster.png"), encodePNG(1024, 1536, pc.data));
}

// 5. splash.png (1920 x 1080, 16:9, atmospheric background, no text)
{
  const pc = new PixelCanvas(1920, 1080);
  pc.fillBackground(16, 24, 52, 6, 8, 16);
  pc.drawCircle(960, 540, 480, 34, 211, 238, 0.16, true);
  pc.drawCircle(620, 420, 360, 244, 63, 94, 0.12, true);
  pc.drawCircle(1300, 640, 360, 251, 191, 36, 0.12, true);
  pc.drawBeam(180, 720, 1740, 360, 2, 24, 34, 211, 238);
  pc.drawBeam(180, 360, 1740, 720, 2, 24, 244, 63, 94);
  fs.writeFileSync(path.join(artDir, "splash.png"), encodePNG(1920, 1080, pc.data));
}

// 6. Gallery Screenshots (desktop 1920x1080 & phone 1080x1920)
const scenes = [
  {
    idx: 3, // Sector 4: Chromatic Split
    state: {
      player: { c: 5, r: 4 },
      echoes: [],
      beams: [
        { c1: 2, r1: 4, c2: 7, r2: 4, color: "white" },
        { c1: 7, r1: 4, c2: 7, r2: 1, color: "cyan" },
        { c1: 7, r1: 1, c2: 12, r2: 1, color: "cyan" },
        { c1: 7, r1: 4, c2: 12, r2: 4, color: "magenta" },
      ],
    },
  },
  {
    idx: 7, // Sector 8: Double Rewind
    state: {
      player: { c: 11, r: 6 },
      echoes: [
        { c: 5, r: 6 },
        { c: 8, r: 6 },
      ],
      beams: [{ c1: 2, r1: 3, c2: 14, r2: 3, color: "gold" }],
    },
  },
  {
    idx: 11, // Sector 12: The Chrono Prism
    state: {
      player: { c: 8, r: 7 },
      echoes: [{ c: 4, r: 7 }],
      beams: [
        { c1: 1, r1: 4, c2: 7, r2: 4, color: "white" },
        { c1: 7, r1: 4, c2: 7, r2: 1, color: "cyan" },
        { c1: 7, r1: 1, c2: 13, r2: 1, color: "cyan" },
        { c1: 7, r1: 4, c2: 11, r2: 4, color: "magenta" },
        { c1: 11, r1: 4, c2: 11, r2: 2, color: "magenta" },
        { c1: 11, r1: 4, c2: 11, r2: 5, color: "magenta" },
        { c1: 11, r1: 5, c2: 11, r2: 7, color: "gold" },
      ],
    },
  },
];

scenes.forEach((sc, i) => {
  const num = String(i + 1).padStart(2, "0");
  fs.writeFileSync(
    path.join(galDir, `screenshot_${num}.png`),
    renderGameplayScreenshot(1920, 1080, sc.idx, sc.state)
  );
  fs.writeFileSync(
    path.join(galDir, `screenshot_${num}_phone.png`),
    renderGameplayScreenshot(1080, 1920, sc.idx, sc.state)
  );
});

console.log("Generated all .arcadible art and gallery screenshots successfully.");
