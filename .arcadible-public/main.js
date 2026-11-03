// Chrono Prism — Original Optical-Temporal Arcade Puzzle Game for Arcadible

const VIRTUAL_W = 1280;
const VIRTUAL_H = 720;
const GRID_COLS = 16;
const GRID_ROWS = 9;
const TILE_SIZE = 64;
const GRID_OFFSET_X = (VIRTUAL_W - GRID_COLS * TILE_SIZE) / 2; // 128
const GRID_OFFSET_Y = (VIRTUAL_H - GRID_ROWS * TILE_SIZE) / 2 + 16; // 88

// Cardinal directions: 0 = East, 1 = South, 2 = West, 3 = North
const DIR_DX = [1, 0, -1, 0];
const DIR_DY = [0, 1, 0, -1];

const COLORS = {
  cyan: { hex: "#22d3ee", glow: "rgba(34, 211, 238, 0.55)", core: "#cffafe", name: "Cyan" },
  magenta: { hex: "#f43f5e", glow: "rgba(244, 63, 94, 0.55)", core: "#ffe4e6", name: "Magenta" },
  gold: { hex: "#fbbf24", glow: "rgba(251, 191, 36, 0.55)", core: "#fef3c7", name: "Gold" },
  white: { hex: "#f8fafc", glow: "rgba(248, 250, 252, 0.6)", core: "#ffffff", name: "White" },
};

const GAME_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyE",
  "KeyR",
  "KeyP",
  "ShiftLeft",
  "ShiftRight",
  "Enter",
  "Escape",
]);

// 12 Hand-Crafted Solvable Sectors
export const SECTORS = [
  {
    id: 1,
    name: "First Refraction",
    subtitle: "Move near a crystal prism and press Rotate to guide the beam.",
    parTime: 12,
    playerStart: { c: 3, r: 4 },
    items: [
      { type: "emitter", c: 2, r: 2, dir: 0, color: "cyan" },
      { type: "prism", c: 7, r: 2, dir: 0 }, // rotate to 1 (South)
      { type: "prism", c: 7, r: 6, dir: 3 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 6, color: "cyan" },
    ],
  },
  {
    id: 2,
    name: "Dual Harmonics",
    subtitle: "Split a single photon stream to energize both resonators at once.",
    parTime: 16,
    playerStart: { c: 4, r: 4 },
    items: [
      { type: "emitter", c: 2, r: 4, dir: 0, color: "cyan" },
      { type: "splitter", c: 7, r: 4, dir: 0 }, // outputs dir and (dir+2)%4 -> rotate to 1 (South & North)
      { type: "prism", c: 7, r: 1, dir: 1 }, // rotate to 0 (East)
      { type: "prism", c: 7, r: 7, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 1, color: "cyan" },
      { type: "resonator", c: 13, r: 7, color: "cyan" },
    ],
  },
  {
    id: 3,
    name: "Echo of the Past",
    subtitle: "Stand on the Phase Pad, then press Rewind so your Time Echo holds the gate open.",
    parTime: 18,
    playerStart: { c: 4, r: 6 },
    items: [
      { type: "emitter", c: 2, r: 3, dir: 0, color: "magenta" },
      { type: "pad", c: 4, r: 6, gateId: 1 },
      { type: "gate", c: 6, r: 3, gateId: 1 },
      { type: "gate", c: 10, r: 3, gateId: 2 },
      { type: "pad", c: 10, r: 6, gateId: 2 },
      { type: "resonator", c: 13, r: 3, color: "magenta" },
    ],
  },
  {
    id: 4,
    name: "Chromatic Split",
    subtitle: "A Chromatic Prism splits white light into cyan (primary) and magenta (90 deg clockwise).",
    parTime: 20,
    playerStart: { c: 5, r: 4 },
    items: [
      { type: "emitter", c: 2, r: 4, dir: 0, color: "white" },
      { type: "chromatic", c: 7, r: 4, dir: 2 }, // rotate to 3: Cyan->North(3), Magenta->East(0)
      { type: "prism", c: 7, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 12, r: 1, color: "cyan" },
      { type: "resonator", c: 12, r: 4, color: "magenta" },
    ],
  },
  {
    id: 5,
    name: "Twin Phase Locks",
    subtitle: "Record a Time Echo on Pad 1, then hold Pad 2 and rotate the prism.",
    parTime: 22,
    playerStart: { c: 3, r: 6 },
    items: [
      { type: "emitter", c: 2, r: 2, dir: 0, color: "gold" },
      { type: "gate", c: 5, r: 2, gateId: 1 },
      { type: "pad", c: 5, r: 6, gateId: 1 },
      { type: "prism", c: 9, r: 2, dir: 3 }, // rotate to 1 (South)
      { type: "gate", c: 9, r: 4, gateId: 2 },
      { type: "pad", c: 9, r: 6, gateId: 2 },
      { type: "resonator", c: 9, r: 7, color: "gold" },
    ],
  },
  {
    id: 6,
    name: "Spectrum Shifter",
    subtitle: "Split the cyan beam and pass one branch through a Gold Shifter.",
    parTime: 24,
    playerStart: { c: 5, r: 5 },
    items: [
      { type: "emitter", c: 2, r: 2, dir: 0, color: "cyan" },
      { type: "splitter", c: 6, r: 2, dir: 1 }, // outputs South(1) and North(3) -> rotate to 0 (East & West) or keep 1? Wait: if splitter is at (6,2), we want East(0) and South(1)! So let's use Chromatic or 2 prisms!
      { type: "prism", c: 6, r: 0, dir: 1 }, // North branch hits (6,0) -> rotate to 0 (East)
      { type: "resonator", c: 12, r: 0, color: "cyan" },
      { type: "shifter", c: 6, r: 5, color: "gold" },
      { type: "prism", c: 6, r: 7, dir: 2 }, // South branch hits (6,7) -> rotate to 0 (East)
      { type: "resonator", c: 12, r: 7, color: "gold" },
    ],
  },
  {
    id: 7,
    name: "Obsidian Corridor",
    subtitle: "Route the beam around solid obsidian blocks while holding the phase gate.",
    parTime: 25,
    playerStart: { c: 3, r: 5 },
    items: [
      { type: "emitter", c: 2, r: 4, dir: 0, color: "cyan" },
      { type: "wall", c: 6, r: 4 },
      { type: "wall", c: 6, r: 3 },
      { type: "wall", c: 6, r: 5 },
      { type: "prism", c: 4, r: 4, dir: 0 }, // rotate to 3 (North)
      { type: "prism", c: 4, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "gate", c: 8, r: 1, gateId: 1 },
      { type: "pad", c: 4, r: 7, gateId: 1 },
      { type: "prism", c: 11, r: 1, dir: 0 }, // rotate to 1 (South)
      { type: "resonator", c: 11, r: 6, color: "cyan" },
    ],
  },
  {
    id: 8,
    name: "Double Rewind",
    subtitle: "Chain two Time Echoes to hold pads 1 and 2 while you stand on pad 3.",
    parTime: 28,
    playerStart: { c: 4, r: 6 },
    items: [
      { type: "emitter", c: 2, r: 3, dir: 0, color: "gold" },
      { type: "gate", c: 5, r: 3, gateId: 1 },
      { type: "gate", c: 8, r: 3, gateId: 2 },
      { type: "gate", c: 11, r: 3, gateId: 3 },
      { type: "pad", c: 5, r: 6, gateId: 1 },
      { type: "pad", c: 8, r: 6, gateId: 2 },
      { type: "pad", c: 11, r: 6, gateId: 3 },
      { type: "resonator", c: 14, r: 3, color: "gold" },
    ],
  },
  {
    id: 9,
    name: "Optical Crossfire",
    subtitle: "Weave two independent photon streams across the central nexus.",
    parTime: 26,
    playerStart: { c: 7, r: 4 },
    items: [
      { type: "emitter", c: 2, r: 2, dir: 0, color: "cyan" },
      { type: "emitter", c: 2, r: 6, dir: 0, color: "magenta" },
      { type: "prism", c: 6, r: 2, dir: 3 }, // rotate to 1 (South)
      { type: "prism", c: 6, r: 7, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 7, color: "cyan" },
      { type: "prism", c: 10, r: 6, dir: 1 }, // rotate to 3 (North)
      { type: "prism", c: 10, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 1, color: "magenta" },
    ],
  },
  {
    id: 10,
    name: "Harmonic Triad",
    subtitle: "Split white light and divide the magenta branch to feed three resonators.",
    parTime: 30,
    playerStart: { c: 5, r: 4 },
    items: [
      { type: "emitter", c: 2, r: 4, dir: 0, color: "white" },
      { type: "chromatic", c: 6, r: 4, dir: 1 }, // rotate to 3: Cyan->North(3), Magenta->East(0)
      { type: "prism", c: 6, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 1, color: "cyan" },
      { type: "splitter", c: 10, r: 4, dir: 0 }, // rotate to 1 (South & North)
      { type: "resonator", c: 10, r: 2, color: "magenta" },
      { type: "shifter", c: 10, r: 6, color: "gold" },
      { type: "resonator", c: 10, r: 7, color: "gold" },
    ],
  },
  {
    id: 11,
    name: "Temporal Relay",
    subtitle: "Hold the phase gate with a Time Echo while aligning the dual splitter circuit.",
    parTime: 32,
    playerStart: { c: 4, r: 6 },
    items: [
      { type: "emitter", c: 2, r: 4, dir: 0, color: "cyan" },
      { type: "gate", c: 5, r: 4, gateId: 1 },
      { type: "pad", c: 5, r: 7, gateId: 1 },
      { type: "splitter", c: 8, r: 4, dir: 0 }, // rotate to 1 (South & North)
      { type: "prism", c: 8, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "prism", c: 8, r: 7, dir: 2 }, // rotate to 0 (East)
      { type: "gate", c: 11, r: 1, gateId: 2 },
      { type: "pad", c: 11, r: 4, gateId: 2 },
      { type: "resonator", c: 13, r: 1, color: "cyan" },
      { type: "resonator", c: 13, r: 7, color: "cyan" },
    ],
  },
  {
    id: 12,
    name: "The Chrono Prism",
    subtitle: "Master light and time: combine chromatic splitting, gold shifting, and twin Time Echoes.",
    parTime: 38,
    playerStart: { c: 4, r: 5 },
    items: [
      { type: "emitter", c: 1, r: 4, dir: 0, color: "white" },
      { type: "gate", c: 4, r: 4, gateId: 1 },
      { type: "pad", c: 4, r: 7, gateId: 1 },
      { type: "chromatic", c: 7, r: 4, dir: 0 }, // rotate to 3: Cyan->North(3), Magenta->East(0)
      { type: "prism", c: 7, r: 1, dir: 2 }, // rotate to 0 (East)
      { type: "resonator", c: 13, r: 1, color: "cyan" },
      { type: "splitter", c: 11, r: 4, dir: 0 }, // rotate to 1 (South & North)
      { type: "resonator", c: 11, r: 2, color: "magenta" },
      { type: "shifter", c: 11, r: 5, color: "gold" },
      { type: "gate", c: 11, r: 6, gateId: 2 },
      { type: "pad", c: 8, r: 7, gateId: 2 },
      { type: "resonator", c: 11, r: 7, color: "gold" },
    ],
  },
];

// Procedural Endless Sector Generator
export function generateEndlessSector(waveNumber) {
  const rngSeed = waveNumber * 2654435761;
  let s = rngSeed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const colors = ["cyan", "magenta", "gold"];
  const c1 = colors[waveNumber % 3];
  const rMid = 2 + Math.floor(rand() * 3);
  const cPrism1 = 5 + Math.floor(rand() * 3);
  const rPrism2 = rMid + 2 + Math.floor(rand() * 2);
  const hasGate = waveNumber >= 2;

  const items = [
    { type: "emitter", c: 2, r: rMid, dir: 0, color: c1 },
    { type: "prism", c: cPrism1, r: rMid, dir: (1 + Math.floor(rand() * 3)) % 4 },
    { type: "prism", c: cPrism1, r: rPrism2, dir: (1 + Math.floor(rand() * 3)) % 4 },
    { type: "resonator", c: 13, r: rPrism2, color: c1 },
  ];
  if (hasGate) {
    items.push({ type: "gate", c: cPrism1 + 3, r: rPrism2, gateId: 1 });
    items.push({ type: "pad", c: cPrism1 - 1, r: rPrism2, gateId: 1 });
  }
  return {
    id: 100 + waveNumber,
    name: `Flux Wave ${waveNumber}`,
    subtitle: "Endless Harmonic Flux — stabilize the circuit as fast as possible!",
    parTime: 20,
    playerStart: { c: 3, r: Math.min(7, rMid + 2) },
    items,
  };
}

// Web Audio Synthesizer
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this.initialized = true;
  }

  suspend() {
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
    }
  }

  resume() {
    if (!this.muted && this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(freq, duration = 0.14, type = "sine", gainVal = 0.12, slideTo = null) {
    if (this.muted || !this.ctx || this.ctx.state !== "running") return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore audio errors
    }
  }

  playRotate() {
    this.playTone(523.25, 0.1, "triangle", 0.14, 659.25);
  }

  playPadActivate() {
    this.playTone(392.0, 0.12, "sine", 0.12, 587.33);
  }

  playRewind() {
    this.playTone(783.99, 0.35, "sawtooth", 0.1, 196.0);
    setTimeout(() => this.playTone(587.33, 0.25, "sine", 0.12, 293.66), 80);
  }

  playSectorClear() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.28, "triangle", 0.15), idx * 90);
    });
  }
}

// Arcadible SDK Save Manager
class SaveManager {
  constructor() {
    this.SCHEMA_VERSION = 1;
    this.SAVE_KEY = "progress";
    this.state = {
      schema: 1,
      unlockedSector: 1,
      sectorStars: {},
      bestTimes: {},
      endlessHighScore: 0,
      reducedMotion: window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
      muted: false,
    };
    this.memoryOnlyNotice = false;
    this.storageFullNotice = false;
    this.ready = false;
    this.newerVersionDetected = false;
    this.retryTimer = null;
  }

  async init() {
    const sdk = window.arcadible;
    if (!sdk || !sdk.saves) {
      this.ready = true;
      return;
    }
    try {
      await sdk.ready;
      if (sdk.saves.where === "memory") {
        this.memoryOnlyNotice = true;
      }
      const raw = await sdk.saves.read(this.SAVE_KEY);
      if (raw) {
        this.mergeLoaded(raw);
      }
    } catch (err) {
      // Do not overwrite or reset if saves couldn't be reached at startup
      console.warn("Save load warning:", err);
    }
    this.ready = true;
  }

  mergeLoaded(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (typeof parsed.schema === "number" && parsed.schema > this.SCHEMA_VERSION) {
        this.newerVersionDetected = true;
        return;
      }
      this.state.unlockedSector = Math.max(
        this.state.unlockedSector,
        Number(parsed.unlockedSector) || 1
      );
      if (parsed.sectorStars && typeof parsed.sectorStars === "object") {
        for (const [k, v] of Object.entries(parsed.sectorStars)) {
          this.state.sectorStars[k] = Math.max(this.state.sectorStars[k] || 0, Number(v) || 0);
        }
      }
      if (parsed.bestTimes && typeof parsed.bestTimes === "object") {
        for (const [k, v] of Object.entries(parsed.bestTimes)) {
          const cur = this.state.bestTimes[k];
          const num = Number(v);
          if (num > 0 && (!cur || num < cur)) {
            this.state.bestTimes[k] = num;
          }
        }
      }
      this.state.endlessHighScore = Math.max(
        this.state.endlessHighScore,
        Number(parsed.endlessHighScore) || 0
      );
      if (typeof parsed.muted === "boolean") {
        this.state.muted = parsed.muted;
      }
      if (typeof parsed.reducedMotion === "boolean") {
        this.state.reducedMotion = parsed.reducedMotion;
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  async save() {
    if (this.newerVersionDetected) return;
    const sdk = window.arcadible;
    if (!sdk || !sdk.saves) return;
    try {
      await sdk.ready;
      const existing = sdk.saves.readSync ? sdk.saves.readSync(this.SAVE_KEY) : null;
      if (existing) {
        this.mergeLoaded(existing);
      }
      if (this.newerVersionDetected) return;
      const payload = JSON.stringify(this.state);
      await sdk.saves.write(this.SAVE_KEY, payload);
      this.storageFullNotice = false;
    } catch (err) {
      const code = err && err.code ? err.code : "unavailable";
      if (code === "full") {
        this.storageFullNotice = true;
      } else if (!["invalid", "too_large", "too_many", "unsupported"].includes(code)) {
        if (!this.retryTimer) {
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.save();
          }, 2500);
        }
      }
    }
  }
}

export class ChronoPrismGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sound = new SoundEngine();
    this.saves = new SaveManager();

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.safeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

    // Input tracking
    this.lastInputType = "keyboard"; // "keyboard" | "mouse" | "gamepad" | "touch"
    this.hasTouch =
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    this.keysDown = new Set();
    this.mousePos = { x: VIRTUAL_W / 2, y: VIRTUAL_H / 2, active: false };
    this.touchStick = { active: false, id: null, startX: 0, startY: 0, dx: 0, dy: 0 };
    this.gamepadPrevButtons = [];

    // Game state
    this.mode = "playing"; // Starts immediately interactive on Sector 1! ("playing" | "paused" | "sector_select" | "victory")
    this.isEndless = false;
    this.endlessWave = 1;
    this.endlessScore = 0;
    this.currentSectorIndex = 0;
    this.sectorTime = 0;
    this.chargeProgress = 0; // 0..1 when all resonators are energized
    this.rewindFlash = 0;
    this.bannerTimer = 3.5;

    // Entities
    this.player = { x: 0, y: 0, vx: 0, vy: 0, radius: 18, angle: 0 };
    this.items = [];
    this.beams = [];
    this.particles = [];

    // Chrono Rewind history & Time Echo clones
    this.history = []; // ring buffer of { t, x, y, rotations: [{idx, dir}] }
    this.pendingRotations = [];
    this.echoes = []; // max 2 active echoes

    // UI clickable buttons in virtual coordinates
    this.uiButtons = [];

    this.loadSector(0, false);
  }

  gridToWorld(c, r) {
    return {
      x: GRID_OFFSET_X + (c + 0.5) * TILE_SIZE,
      y: GRID_OFFSET_Y + (r + 0.5) * TILE_SIZE,
    };
  }

  worldToGrid(x, y) {
    return {
      c: Math.floor((x - GRID_OFFSET_X) / TILE_SIZE),
      r: Math.floor((y - GRID_OFFSET_Y) / TILE_SIZE),
    };
  }

  loadSector(index, endless = false) {
    this.isEndless = endless;
    let template;
    if (endless) {
      template = generateEndlessSector(this.endlessWave);
    } else {
      this.currentSectorIndex = Math.max(0, Math.min(SECTORS.length - 1, index));
      template = SECTORS[this.currentSectorIndex];
    }

    this.sectorMeta = {
      id: template.id,
      name: template.name,
      subtitle: template.subtitle,
      parTime: template.parTime,
    };

    const startPos = this.gridToWorld(template.playerStart.c, template.playerStart.r);
    this.player.x = startPos.x;
    this.player.y = startPos.y;
    this.player.vx = 0;
    this.player.vy = 0;

    this.items = template.items.map((it, idx) => ({
      ...it,
      id: idx,
      initialDir: it.dir ?? 0,
      energized: false,
      open: false,
      animScale: 1,
    }));

    this.sectorTime = 0;
    this.chargeProgress = 0;
    this.rewindFlash = 0;
    this.bannerTimer = 4.0;
    this.history = [];
    this.pendingRotations = [];
    this.echoes = [];
    this.particles = [];
    this.recalculateBeams();
  }

  // Core Optical Raycast Engine
  recalculateBeams() {
    for (const it of this.items) {
      if (it.type === "resonator") {
        it.energized = false;
      }
    }

    this.beams = [];
    const queue = [];

    for (const it of this.items) {
      if (it.type === "emitter") {
        queue.push({
          c: it.c,
          r: it.r,
          dir: it.dir,
          color: it.color,
          depth: 0,
        });
      }
    }

    const visited = new Set();

    while (queue.length > 0) {
      const ray = queue.shift();
      if (ray.depth > 32) continue;

      const key = `${ray.c},${ray.r},${ray.dir},${ray.color}`;
      if (visited.has(key)) continue;
      visited.add(key);

      let curC = ray.c;
      let curR = ray.r;
      let hitC = curC;
      let hitR = curR;

      for (let step = 1; step <= 20; step++) {
        const nextC = curC + DIR_DX[ray.dir] * step;
        const nextR = curR + DIR_DY[ray.dir] * step;

        if (nextC < 0 || nextC >= GRID_COLS || nextR < 0 || nextR >= GRID_ROWS) {
          hitC = nextC;
          hitR = nextR;
          break;
        }

        hitC = nextC;
        hitR = nextR;

        const blocker = this.items.find(
          (item) => item.c === nextC && item.r === nextR && item.type !== "pad"
        );

        if (blocker) {
          if (blocker.type === "wall" || blocker.type === "emitter") {
            break;
          } else if (blocker.type === "gate") {
            if (!blocker.open) {
              break;
            }
            // Open gates let the beam continue!
          } else if (blocker.type === "prism") {
            queue.push({
              c: nextC,
              r: nextR,
              dir: blocker.dir,
              color: ray.color,
              depth: ray.depth + 1,
            });
            break;
          } else if (blocker.type === "splitter") {
            queue.push({
              c: nextC,
              r: nextR,
              dir: blocker.dir,
              color: ray.color,
              depth: ray.depth + 1,
            });
            queue.push({
              c: nextC,
              r: nextR,
              dir: (blocker.dir + 2) % 4,
              color: ray.color,
              depth: ray.depth + 1,
            });
            break;
          } else if (blocker.type === "chromatic") {
            const cColor = ray.color === "white" ? "cyan" : ray.color;
            const mColor = ray.color === "white" ? "magenta" : ray.color;
            queue.push({
              c: nextC,
              r: nextR,
              dir: blocker.dir,
              color: cColor,
              depth: ray.depth + 1,
            });
            queue.push({
              c: nextC,
              r: nextR,
              dir: (blocker.dir + 1) % 4,
              color: mColor,
              depth: ray.depth + 1,
            });
            break;
          } else if (blocker.type === "shifter") {
            queue.push({
              c: nextC,
              r: nextR,
              dir: ray.dir,
              color: blocker.color,
              depth: ray.depth + 1,
            });
            break;
          } else if (blocker.type === "resonator") {
            if (blocker.color === ray.color || ray.color === "white") {
              blocker.energized = true;
            }
            break;
          }
        }
      }

      const p1 = this.gridToWorld(ray.c, ray.r);
      const p2 = this.gridToWorld(hitC, hitR);
      this.beams.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: ray.color,
      });
    }
  }

  findNearestInteractive(x, y) {
    let best = null;
    let bestDist = 78; // interaction radius
    for (const it of this.items) {
      if (it.type === "prism" || it.type === "splitter" || it.type === "chromatic") {
        const pos = this.gridToWorld(it.c, it.r);
        const d = Math.hypot(pos.x - x, pos.y - y);
        if (d < bestDist) {
          bestDist = d;
          best = it;
        }
      }
    }
    return best;
  }

  triggerAction() {
    this.sound.unlock();
    if (this.mode === "paused") {
      this.mode = "playing";
      this.sound.resume();
      return;
    }
    if (this.mode === "victory") {
      this.advanceToNextSector();
      return;
    }
    if (this.mode !== "playing") return;

    const target = this.findNearestInteractive(this.player.x, this.player.y);
    if (target) {
      target.dir = (target.dir + 1) % 4;
      target.animScale = 1.32;
      this.pendingRotations.push({ id: target.id, dir: target.dir });
      this.sound.playRotate();
      this.spawnBurst(
        this.gridToWorld(target.c, target.r).x,
        this.gridToWorld(target.c, target.r).y,
        "#22d3ee",
        10
      );
      this.recalculateBeams();
    } else {
      // Harmonic pulse visual
      this.sound.playTone(440, 0.08, "sine", 0.08, 660);
      this.spawnBurst(this.player.x, this.player.y, "#38bdf8", 8);
    }
  }

  triggerRewind() {
    this.sound.unlock();
    if (this.mode !== "playing") return;
    if (this.history.length < 5) return;

    // Create a Time Echo from the recorded 5-second history slice
    const recordedFrames = this.history.map((f) => ({
      x: f.x,
      y: f.y,
      rotations: [...f.rotations],
    }));

    this.echoes.push({
      frames: recordedFrames,
      cursor: 0,
      x: recordedFrames[0].x,
      y: recordedFrames[0].y,
      active: true,
    });
    if (this.echoes.length > 2) {
      this.echoes.shift();
    }

    // Rewind player position to the start of the recorded slice
    const startFrame = recordedFrames[0];
    this.player.x = startFrame.x;
    this.player.y = startFrame.y;
    this.history = [];
    this.pendingRotations = [];
    this.rewindFlash = 1.0;

    // Reset all existing echoes to replay from frame 0 in sync
    for (const echo of this.echoes) {
      echo.cursor = 0;
      echo.active = true;
      if (echo.frames.length > 0) {
        echo.x = echo.frames[0].x;
        echo.y = echo.frames[0].y;
      }
    }

    this.sound.playRewind();
    this.spawnBurst(this.player.x, this.player.y, "#f43f5e", 18);
  }

  advanceToNextSector() {
    if (this.isEndless) {
      this.endlessWave += 1;
      this.mode = "playing";
      this.loadSector(0, true);
      return;
    }
    const nextIdx = (this.currentSectorIndex + 1) % SECTORS.length;
    this.mode = "playing";
    this.loadSector(nextIdx, false);
  }

  spawnBurst(x, y, color, count = 12) {
    if (this.saves.state.reducedMotion) count = Math.min(3, count);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color,
      });
    }
  }

  update(dt) {
    this.pollGamepad();

    if (this.mode !== "playing") return;

    this.sectorTime += dt;
    if (this.bannerTimer > 0) this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    if (this.rewindFlash > 0) this.rewindFlash = Math.max(0, this.rewindFlash - dt * 2.5);

    // Compute movement input vector
    let ix = 0;
    let iy = 0;

    if (this.keysDown.has("KeyW") || this.keysDown.has("ArrowUp")) iy -= 1;
    if (this.keysDown.has("KeyS") || this.keysDown.has("ArrowDown")) iy += 1;
    if (this.keysDown.has("KeyA") || this.keysDown.has("ArrowLeft")) ix -= 1;
    if (this.keysDown.has("KeyD") || this.keysDown.has("ArrowRight")) ix += 1;

    if (this.touchStick.active) {
      ix += this.touchStick.dx;
      iy += this.touchStick.dy;
    } else if (this.gamepadAxisX || this.gamepadAxisY) {
      ix += this.gamepadAxisX;
      iy += this.gamepadAxisY;
    } else if (this.lastInputType === "mouse" && this.mousePos.active && ix === 0 && iy === 0) {
      const dx = this.mousePos.x - this.player.x;
      const dy = this.mousePos.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        const factor = Math.min(1, (dist - 14) / 60);
        ix = (dx / dist) * factor;
        iy = (dy / dist) * factor;
      }
    }

    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    const moveSpeed = 260;
    this.player.vx = ix * moveSpeed;
    this.player.vy = iy * moveSpeed;

    const nextX = Math.max(
      GRID_OFFSET_X + 20,
      Math.min(GRID_OFFSET_X + GRID_COLS * TILE_SIZE - 20, this.player.x + this.player.vx * dt)
    );
    const nextY = Math.max(
      GRID_OFFSET_Y + 20,
      Math.min(GRID_OFFSET_Y + GRID_ROWS * TILE_SIZE - 20, this.player.y + this.player.vy * dt)
    );

    // Check wall collisions
    let canX = true;
    let canY = true;
    for (const it of this.items) {
      if (it.type === "wall") {
        const pos = this.gridToWorld(it.c, it.r);
        if (Math.abs(nextX - pos.x) < 38 && Math.abs(this.player.y - pos.y) < 38) canX = false;
        if (Math.abs(this.player.x - pos.x) < 38 && Math.abs(nextY - pos.y) < 38) canY = false;
      }
    }
    if (canX) this.player.x = nextX;
    if (canY) this.player.y = nextY;
    if (mag > 0.05) {
      this.player.angle = Math.atan2(iy, ix);
    }

    // Record history frame (60Hz cap, keep last 300 frames = 5 seconds)
    this.history.push({
      x: this.player.x,
      y: this.player.y,
      rotations: this.pendingRotations,
    });
    this.pendingRotations = [];
    if (this.history.length > 300) {
      this.history.shift();
    }

    // Advance Time Echoes
    let echoRotated = false;
    for (const echo of this.echoes) {
      if (!echo.active || echo.frames.length === 0) continue;
      const idx = Math.min(echo.frames.length - 1, echo.cursor);
      const frame = echo.frames[idx];
      echo.x = frame.x;
      echo.y = frame.y;
      if (echo.cursor < echo.frames.length) {
        for (const rot of frame.rotations) {
          const item = this.items.find((i) => i.id === rot.id);
          if (item && item.dir !== rot.dir) {
            item.dir = rot.dir;
            item.animScale = 1.28;
            echoRotated = true;
          }
        }
        echo.cursor += 1;
      }
    }

    // Check Phase Pads (held by Player or any Time Echo)
    const activeGates = new Set();
    for (const it of this.items) {
      if (it.type === "pad") {
        const pos = this.gridToWorld(it.c, it.r);
        let pressed = Math.hypot(this.player.x - pos.x, this.player.y - pos.y) < 36;
        if (!pressed) {
          for (const echo of this.echoes) {
            if (echo.active && Math.hypot(echo.x - pos.x, echo.y - pos.y) < 36) {
              pressed = true;
              break;
            }
          }
        }
        if (pressed) {
          activeGates.add(it.gateId);
        }
      }
    }

    let gatesChanged = false;
    for (const it of this.items) {
      if (it.type === "gate") {
        const shouldOpen = activeGates.has(it.gateId);
        if (it.open !== shouldOpen) {
          it.open = shouldOpen;
          gatesChanged = true;
          if (shouldOpen) this.sound.playPadActivate();
        }
      }
      if (it.animScale > 1) {
        it.animScale = Math.max(1, it.animScale - dt * 2.4);
      }
    }

    if (echoRotated || gatesChanged) {
      this.recalculateBeams();
    }

    // Check if all resonators are energized
    const resonators = this.items.filter((i) => i.type === "resonator");
    const allLit = resonators.length > 0 && resonators.every((r) => r.energized);

    if (allLit) {
      this.chargeProgress = Math.min(1, this.chargeProgress + dt / 1.1);
      if (this.chargeProgress >= 1) {
        this.onSectorComplete();
      }
    } else {
      this.chargeProgress = Math.max(0, this.chargeProgress - dt * 1.5);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  onSectorComplete() {
    this.mode = "victory";
    this.sound.playSectorClear();

    for (const it of this.items) {
      if (it.type === "resonator") {
        const pos = this.gridToWorld(it.c, it.r);
        this.spawnBurst(pos.x, pos.y, COLORS[it.color].hex, 22);
      }
    }

    if (this.isEndless) {
      const waveBonus = Math.max(100, Math.round(500 - this.sectorTime * 10));
      this.endlessScore += waveBonus;
      if (this.endlessScore > this.saves.state.endlessHighScore) {
        this.saves.state.endlessHighScore = this.endlessScore;
      }
      this.saves.save();
    } else {
      const secNum = this.currentSectorIndex + 1;
      const stars =
        this.sectorTime <= this.sectorMeta.parTime
          ? 3
          : this.sectorTime <= this.sectorMeta.parTime * 1.6
          ? 2
          : 1;
      this.saves.state.sectorStars[secNum] = Math.max(
        this.saves.state.sectorStars[secNum] || 0,
        stars
      );
      const prevBest = this.saves.state.bestTimes[secNum];
      const rounded = Math.round(this.sectorTime * 10) / 10;
      if (!prevBest || rounded < prevBest) {
        this.saves.state.bestTimes[secNum] = rounded;
      }
      if (secNum < SECTORS.length) {
        this.saves.state.unlockedSector = Math.max(
          this.saves.state.unlockedSector,
          secNum + 1
        );
      }
      this.saves.save();
    }
  }

  pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    this.gamepadAxisX = 0;
    this.gamepadAxisY = 0;
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const ax0 = pad.axes[0] || 0;
      const ax1 = pad.axes[1] || 0;
      if (Math.hypot(ax0, ax1) > 0.18) {
        this.gamepadAxisX = ax0;
        this.gamepadAxisY = ax1;
        this.lastInputType = "gamepad";
      }
      // D-pad buttons 12..15
      if (pad.buttons[12]?.pressed) { this.gamepadAxisY = -1; this.lastInputType = "gamepad"; }
      if (pad.buttons[13]?.pressed) { this.gamepadAxisY = 1; this.lastInputType = "gamepad"; }
      if (pad.buttons[14]?.pressed) { this.gamepadAxisX = -1; this.lastInputType = "gamepad"; }
      if (pad.buttons[15]?.pressed) { this.gamepadAxisX = 1; this.lastInputType = "gamepad"; }

      const b0 = Boolean(pad.buttons[0]?.pressed);
      const b1 = Boolean(pad.buttons[1]?.pressed || pad.buttons[2]?.pressed);
      const b9 = Boolean(pad.buttons[9]?.pressed);

      if (b0 && !this.gamepadPrevButtons[0]) {
        this.lastInputType = "gamepad";
        this.triggerAction();
      }
      if (b1 && !this.gamepadPrevButtons[1]) {
        this.lastInputType = "gamepad";
        this.triggerRewind();
      }
      if (b9 && !this.gamepadPrevButtons[9]) {
        this.lastInputType = "gamepad";
        this.togglePause();
      }
      this.gamepadPrevButtons[0] = b0;
      this.gamepadPrevButtons[1] = b1;
      this.gamepadPrevButtons[9] = b9;
      break;
    }
  }

  togglePause() {
    if (this.mode === "playing") {
      this.mode = "paused";
      this.sound.suspend();
      this.saves.save();
    } else if (this.mode === "paused" || this.mode === "sector_select") {
      this.mode = "playing";
      this.sound.resume();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear full canvas with deep cosmic background
    ctx.fillStyle = "#070913";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Transform into virtual 1280x720 coordinate system
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Background radial glow
    const bgGrad = ctx.createRadialGradient(
      VIRTUAL_W * 0.5,
      VIRTUAL_H * 0.5,
      60,
      VIRTUAL_W * 0.5,
      VIRTUAL_H * 0.5,
      720
    );
    bgGrad.addColorStop(0, "#111936");
    bgGrad.addColorStop(1, "#070913");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // Draw subtle harmonic arena grid
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= GRID_COLS; c++) {
      const x = GRID_OFFSET_X + c * TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, GRID_OFFSET_Y);
      ctx.lineTo(x, GRID_OFFSET_Y + GRID_ROWS * TILE_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = GRID_OFFSET_Y + r * TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(GRID_OFFSET_X, y);
      ctx.lineTo(GRID_OFFSET_X + GRID_COLS * TILE_SIZE, y);
      ctx.stroke();
    }

    // Arena border
    ctx.strokeStyle = "rgba(34, 211, 238, 0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      GRID_OFFSET_X,
      GRID_OFFSET_Y,
      GRID_COLS * TILE_SIZE,
      GRID_ROWS * TILE_SIZE
    );

    // Draw Laser Beams (underneath crystal nodes for crisp junctions)
    for (const b of this.beams) {
      const cInfo = COLORS[b.color] || COLORS.cyan;
      ctx.save();
      ctx.strokeStyle = cInfo.glow;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = cInfo.hex;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = cInfo.core;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    const nearestTarget = this.findNearestInteractive(this.player.x, this.player.y);

    // Draw Arena Items
    for (const it of this.items) {
      const pos = this.gridToWorld(it.c, it.r);
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(it.animScale || 1, it.animScale || 1);

      if (it === nearestTarget && this.mode === "playing") {
        ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (it.type === "wall") {
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.fillRect(-26, -26, 52, 52);
        ctx.strokeRect(-26, -26, 52, 52);
      } else if (it.type === "emitter") {
        const col = COLORS[it.color] || COLORS.cyan;
        ctx.rotate((it.dir * Math.PI) / 2);
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = col.hex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col.hex;
        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.lineTo(8, -10);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
      } else if (it.type === "prism") {
        ctx.rotate((it.dir * Math.PI) / 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-16, -20);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-16, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (it.type === "splitter") {
        ctx.rotate((it.dir * Math.PI) / 2);
        ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(0, -18);
        ctx.lineTo(-22, 0);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (it.type === "chromatic") {
        ctx.rotate((it.dir * Math.PI) / 2);
        ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const r = 21;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Direction indicators for Cyan (0) and Magenta (+90 deg)
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(10, -3, 12, 6);
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(-3, 10, 6, 12);
      } else if (it.type === "shifter") {
        const col = COLORS[it.color] || COLORS.gold;
        ctx.fillStyle = col.glow;
        ctx.strokeStyle = col.hex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (it.type === "pad") {
        ctx.strokeStyle = "#fbbf24";
        ctx.fillStyle = "rgba(251, 191, 36, 0.14)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`P${it.gateId}`, 0, 0);
      } else if (it.type === "gate") {
        ctx.strokeStyle = it.open ? "rgba(52, 211, 153, 0.45)" : "#fbbf24";
        ctx.fillStyle = it.open ? "rgba(52, 211, 153, 0.08)" : "rgba(251, 191, 36, 0.28)";
        ctx.lineWidth = 3;
        ctx.strokeRect(-22, -22, 44, 44);
        if (!it.open) {
          ctx.fillRect(-22, -22, 44, 44);
        }
        ctx.fillStyle = it.open ? "#34d399" : "#fbbf24";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`G${it.gateId}`, 0, 0);
      } else if (it.type === "resonator") {
        const col = COLORS[it.color] || COLORS.cyan;
        ctx.fillStyle = it.energized ? col.glow : "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = col.hex;
        ctx.lineWidth = it.energized ? 4 : 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 23, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = it.energized ? col.core : col.hex;
        ctx.beginPath();
        ctx.arc(0, 0, it.energized ? 11 : 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw Time Echo Clones
    for (let i = 0; i < this.echoes.length; i++) {
      const echo = this.echoes[i];
      if (!echo.active) continue;
      ctx.save();
      ctx.translate(echo.x, echo.y);
      ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
      ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fda4af";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`E${i + 1}`, 0, 0);
      ctx.restore();
    }

    // Draw Player (Prism Core)
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);
    ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-14, -15);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Rewind flash overlay
    if (this.rewindFlash > 0 && !this.saves.state.reducedMotion) {
      ctx.fillStyle = `rgba(244, 63, 94, ${this.rewindFlash * 0.22})`;
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    }

    // Render HUD & interactive buttons inside safe area
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderHUD(ctx) {
    this.uiButtons = [];
    const padL = 20 + this.safeInsets.left;
    const padR = 20 + this.safeInsets.right;
    const padT = 16 + this.safeInsets.top;
    const padB = 16 + this.safeInsets.bottom;

    // Top Header Bar
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(padL, padT, VIRTUAL_W - padL - padR, 54);
    ctx.strokeRect(padL, padT, VIRTUAL_W - padL - padR, 54);

    // Title & Current Sector
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const titleStr = this.isEndless
      ? `CHRONO PRISM — ${this.sectorMeta.name}`
      : `CHRONO PRISM — Sector ${this.currentSectorIndex + 1}/${SECTORS.length}: ${this.sectorMeta.name}`;
    ctx.fillText(titleStr, padL + 16, padT + 20);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.fillText(this.sectorMeta.subtitle, padL + 16, padT + 40);

    // Timer & Charge Progress
    ctx.textAlign = "right";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 16px sans-serif";
    const timeText = this.isEndless
      ? `Score: ${this.endlessScore} (Best: ${this.saves.state.endlessHighScore})`
      : `Time: ${this.sectorTime.toFixed(1)}s`;
    ctx.fillText(timeText, VIRTUAL_W - padR - 290, padT + 27);

    // Top-right HUD Buttons: Rewind, Sectors, Endless, Pause
    const addBtn = (id, label, x, y, w, h, accent = "#22d3ee") => {
      this.uiButtons.push({ id, x, y, w, h });
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + w / 2, y + h / 2);
    };

    const btnY = padT + 9;
    addBtn("rewind", "Rewind (R)", VIRTUAL_W - padR - 275, btnY, 92, 36, "#f43f5e");
    addBtn("sectors", "Sectors", VIRTUAL_W - padR - 175, btnY, 80, 36, "#38bdf8");
    addBtn("pause", this.mode === "paused" ? "Resume" : "Pause", VIRTUAL_W - padR - 87, btnY, 74, 36, "#fbbf24");

    // Charge Progress Bar when Resonators are aligned
    if (this.chargeProgress > 0 && this.mode === "playing") {
      const bw = 260;
      const bh = 12;
      const bx = (VIRTUAL_W - bw) / 2;
      const by = padT + 62;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#34d399";
      ctx.fillRect(bx, by, bw * this.chargeProgress, bh);
      ctx.strokeStyle = "#a7f3d0";
      ctx.strokeRect(bx, by, bw, bh);
    }

    // Bottom prompt bar (dynamically adapts to last input device)
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(padL, VIRTUAL_H - padB - 34, VIRTUAL_W - padL - padR, 34);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let promptText = "WASD / Arrows: Move  |  Space / E: Rotate Prism  |  R / Shift: Chrono Rewind  |  P: Pause";
    if (this.lastInputType === "mouse") {
      promptText = "Mouse Cursor: Move Core  |  Left Click: Rotate Prism  |  Right Click: Chrono Rewind";
    } else if (this.lastInputType === "gamepad") {
      promptText = "Left Stick / D-Pad: Move  |  A / Cross: Rotate Prism  |  B / X: Chrono Rewind  |  Start: Pause";
    } else if (this.lastInputType === "touch") {
      promptText = "Left Drag: Virtual Stick  |  Tap ROTATE or REWIND buttons on right";
    }
    ctx.fillText(promptText, padL + 14, VIRTUAL_H - padB - 17);

    // Save status notices (memory-only or storage full)
    if (this.saves.memoryOnlyNotice || this.saves.storageFullNotice) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
      const msg = this.saves.storageFullNotice
        ? "Device storage full: progress cannot be saved."
        : "Memory mode: progress won't be kept after closing.";
      ctx.fillText(msg, VIRTUAL_W - padR - 14, VIRTUAL_H - padB - 17);
    }

    // Touch controls (minimum >= 56 CSS px, positioned clear of screen edges)
    if (this.hasTouch || this.lastInputType === "touch") {
      addBtn(
        "rotate",
        "ROTATE",
        VIRTUAL_W - padR - 180,
        VIRTUAL_H - padB - 130,
        82,
        74,
        "#22d3ee"
      );
      addBtn(
        "rewind",
        "REWIND",
        VIRTUAL_W - padR - 90,
        VIRTUAL_H - padB - 130,
        82,
        74,
        "#f43f5e"
      );
    }

    // Modal Overlays: Victory, Pause, Sector Select
    if (this.mode === "victory") {
      ctx.fillStyle = "rgba(7, 9, 19, 0.82)";
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
      ctx.fillStyle = "#111936";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3;
      ctx.fillRect(VIRTUAL_W / 2 - 230, VIRTUAL_H / 2 - 140, 460, 280);
      ctx.strokeRect(VIRTUAL_W / 2 - 230, VIRTUAL_H / 2 - 140, 460, 280);

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HARMONIC CIRCUIT STABILIZED!", VIRTUAL_W / 2, VIRTUAL_H / 2 - 80);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "18px sans-serif";
      ctx.fillText(
        `${this.sectorMeta.name} cleared in ${this.sectorTime.toFixed(1)}s`,
        VIRTUAL_W / 2,
        VIRTUAL_H / 2 - 30
      );

      addBtn(
        "next_sector",
        "Next Sector (Space / Click)",
        VIRTUAL_W / 2 - 120,
        VIRTUAL_H / 2 + 25,
        240,
        48,
        "#34d399"
      );
    } else if (this.mode === "paused") {
      ctx.fillStyle = "rgba(7, 9, 19, 0.84)";
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
      ctx.fillStyle = "#111936";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.fillRect(VIRTUAL_W / 2 - 220, VIRTUAL_H / 2 - 160, 440, 320);
      ctx.strokeRect(VIRTUAL_W / 2 - 220, VIRTUAL_H / 2 - 160, 440, 320);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAME PAUSED", VIRTUAL_W / 2, VIRTUAL_H / 2 - 110);

      addBtn("resume", "Resume Sector", VIRTUAL_W / 2 - 120, VIRTUAL_H / 2 - 65, 240, 42, "#22d3ee");
      addBtn("restart", "Restart Sector", VIRTUAL_W / 2 - 120, VIRTUAL_H / 2 - 12, 240, 42, "#38bdf8");
      addBtn(
        "toggle_audio",
        `Audio: ${this.sound.muted ? "Muted" : "On"}`,
        VIRTUAL_W / 2 - 120,
        VIRTUAL_H / 2 + 41,
        240,
        42,
        "#c084fc"
      );
      addBtn(
        "toggle_motion",
        `Reduced Motion: ${this.saves.state.reducedMotion ? "On" : "Off"}`,
        VIRTUAL_W / 2 - 120,
        VIRTUAL_H / 2 + 94,
        240,
        42,
        "#fbbf24"
      );
    } else if (this.mode === "sector_select") {
      ctx.fillStyle = "rgba(7, 9, 19, 0.88)";
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
      ctx.fillStyle = "#111936";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.fillRect(180, 90, VIRTUAL_W - 360, VIRTUAL_H - 180);
      ctx.strokeRect(180, 90, VIRTUAL_W - 360, VIRTUAL_H - 180);

      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SELECT HARMONIC SECTOR", VIRTUAL_W / 2, 132);

      for (let i = 0; i < SECTORS.length; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bx = 225 + col * 212;
        const by = 170 + row * 100;
        const stars = this.saves.state.sectorStars[i + 1] || 0;
        const starStr = stars > 0 ? ` (${"*".repeat(stars)})` : "";
        addBtn(
          `select_${i}`,
          `${i + 1}. ${SECTORS[i].name.slice(0, 14)}${starStr}`,
          bx,
          by,
          192,
          68,
          i === this.currentSectorIndex && !this.isEndless ? "#fbbf24" : "#22d3ee"
        );
      }

      addBtn("start_endless", "Endless Flux Mode", 225, 485, 260, 48, "#f43f5e");
      addBtn("resume", "Back to Game", VIRTUAL_W - 445, 485, 220, 48, "#34d399");
    }
  }

  handleUIClick(vx, vy) {
    for (const b of this.uiButtons) {
      if (vx >= b.x && vx <= b.x + b.w && vy >= b.y && vy <= b.y + b.h) {
        this.sound.unlock();
        if (b.id === "rewind") {
          this.triggerRewind();
        } else if (b.id === "rotate") {
          this.triggerAction();
        } else if (b.id === "pause" || b.id === "resume") {
          this.togglePause();
        } else if (b.id === "restart") {
          this.mode = "playing";
          this.loadSector(this.currentSectorIndex, this.isEndless);
        } else if (b.id === "sectors") {
          this.mode = this.mode === "sector_select" ? "playing" : "sector_select";
        } else if (b.id === "next_sector") {
          this.advanceToNextSector();
        } else if (b.id === "toggle_audio") {
          this.sound.muted = !this.sound.muted;
          this.saves.state.muted = this.sound.muted;
          this.saves.save();
        } else if (b.id === "toggle_motion") {
          this.saves.state.reducedMotion = !this.saves.state.reducedMotion;
          this.saves.save();
        } else if (b.id === "start_endless") {
          this.endlessWave = 1;
          this.endlessScore = 0;
          this.mode = "playing";
          this.loadSector(0, true);
        } else if (b.id.startsWith("select_")) {
          const idx = Number(b.id.split("_")[1]);
          this.mode = "playing";
          this.loadSector(idx, false);
        }
        return true;
      }
    }
    return false;
  }

  clientToVirtual(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cx = (clientX - rect.left) * dpr;
    const cy = (clientY - rect.top) * dpr;
    return {
      x: (cx - this.offsetX) / this.scale,
      y: (cy - this.offsetY) / this.scale,
    };
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.scale = Math.min(w / VIRTUAL_W, h / VIRTUAL_H);
    this.offsetX = (w - VIRTUAL_W * this.scale) / 2;
    this.offsetY = (h - VIRTUAL_H * this.scale) / 2;

    const style = getComputedStyle(document.documentElement);
    this.safeInsets = {
      top: (parseFloat(style.getPropertyValue("--safe-top")) || 0) / this.scale,
      right: (parseFloat(style.getPropertyValue("--safe-right")) || 0) / this.scale,
      bottom: (parseFloat(style.getPropertyValue("--safe-bottom")) || 0) / this.scale,
      left: (parseFloat(style.getPropertyValue("--safe-left")) || 0) / this.scale,
    };
  }

  bindEvents() {
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.canvas);
    this.resize();

    window.addEventListener("contextmenu", (e) => e.preventDefault());

    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );

    window.addEventListener("keydown", (e) => {
      if (GAME_KEYS.has(e.code)) {
        e.preventDefault();
      }
      this.lastInputType = "keyboard";
      this.sound.unlock();
      this.keysDown.add(e.code);

      if (e.code === "Space" || e.code === "KeyE" || e.code === "Enter") {
        this.triggerAction();
      } else if (e.code === "KeyR" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        this.triggerRewind();
      } else if (e.code === "KeyP" || e.code === "Escape") {
        this.togglePause();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.code);
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      const v = this.clientToVirtual(e.clientX, e.clientY);
      this.sound.unlock();

      if (e.pointerType === "touch") {
        this.hasTouch = true;
        this.lastInputType = "touch";
        if (this.handleUIClick(v.x, v.y)) return;
        if (v.x < VIRTUAL_W * 0.55) {
          this.touchStick.active = true;
          this.touchStick.id = e.pointerId;
          this.touchStick.startX = v.x;
          this.touchStick.startY = v.y;
          this.touchStick.dx = 0;
          this.touchStick.dy = 0;
        } else {
          this.triggerAction();
        }
      } else {
        this.lastInputType = "mouse";
        this.mousePos = { x: v.x, y: v.y, active: true };
        if (this.handleUIClick(v.x, v.y)) return;
        if (e.button === 2) {
          this.triggerRewind();
        } else {
          this.triggerAction();
        }
      }
    });

    this.canvas.addEventListener("pointermove", (e) => {
      const v = this.clientToVirtual(e.clientX, e.clientY);
      if (e.pointerType === "touch") {
        if (this.touchStick.active && e.pointerId === this.touchStick.id) {
          const dx = v.x - this.touchStick.startX;
          const dy = v.y - this.touchStick.startY;
          const dist = Math.hypot(dx, dy);
          const maxR = 54;
          if (dist > 4) {
            this.touchStick.dx = (dx / dist) * Math.min(1, dist / maxR);
            this.touchStick.dy = (dy / dist) * Math.min(1, dist / maxR);
          } else {
            this.touchStick.dx = 0;
            this.touchStick.dy = 0;
          }
        }
      } else {
        this.lastInputType = "mouse";
        this.mousePos = { x: v.x, y: v.y, active: true };
      }
    });

    const endPointer = (e) => {
      if (this.touchStick.active && e.pointerId === this.touchStick.id) {
        this.touchStick.active = false;
        this.touchStick.dx = 0;
        this.touchStick.dy = 0;
      }
    };
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);

    // Pause and save on visibilitychange / blur / pagehide
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.mode === "playing") this.mode = "paused";
        this.sound.suspend();
        this.saves.save();
      }
    });

    window.addEventListener("blur", () => {
      if (this.mode === "playing") this.mode = "paused";
      this.sound.suspend();
    });

    window.addEventListener("pagehide", () => {
      this.saves.save();
    });

    window.addEventListener("gamepadconnected", () => {
      this.lastInputType = "gamepad";
    });
  }

  async start() {
    this.bindEvents();
    const loader = document.getElementById("boot-loader");
    if (loader) {
      loader.classList.add("hidden");
    }

    // Initialize Arcadible SDK saves asynchronously without blocking first frame
    this.saves.init().then(() => {
      this.sound.muted = Boolean(this.saves.state.muted);
    });

    let lastTime = performance.now();
    const FIXED_STEP = 1 / 60;
    let accumulator = 0;

    const frame = (now) => {
      const elapsed = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      accumulator += elapsed;
      while (accumulator >= FIXED_STEP) {
        this.update(FIXED_STEP);
        accumulator -= FIXED_STEP;
      }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const canvas = document.getElementById("game-canvas");
  if (canvas) {
    const game = new ChronoPrismGame(canvas);
    game.start();
    window.__chronoPrism = game;
  }
}
