import { execFileSync } from "node:child_process";
import { SECTORS, generateEndlessSector } from "../.arcadible-public/main.js";

// Solution table for all 12 sectors: rotations map item index -> target dir
const SOLUTIONS = {
  1: { 1: 1, 2: 0 },
  2: { 1: 1, 2: 0, 3: 0 },
  3: {},
  4: { 1: 3, 2: 0 },
  5: { 3: 1 },
  6: { 1: 1, 2: 0, 5: 0 },
  7: { 4: 3, 5: 0, 8: 1 },
  8: {},
  9: { 2: 1, 3: 0, 5: 3, 6: 0 },
  10: { 1: 3, 2: 0, 4: 1 },
  11: { 3: 1, 4: 0, 5: 0 },
  12: { 3: 3, 4: 0, 6: 1 },
};

const DIR_DX = [1, 0, -1, 0];
const DIR_DY = [0, 1, 0, -1];

function simulateSector(sector, rotOverrides) {
  const items = sector.items.map((it, idx) => ({
    ...it,
    dir: rotOverrides[idx] !== undefined ? rotOverrides[idx] : it.dir,
    open: true, // assume pads held by player + time echoes
    energized: false,
  }));

  const queue = items
    .filter((i) => i.type === "emitter")
    .map((i) => ({ c: i.c, r: i.r, dir: i.dir, color: i.color, depth: 0 }));
  const visited = new Set();

  while (queue.length > 0) {
    const ray = queue.shift();
    if (ray.depth > 32) continue;
    const key = `${ray.c},${ray.r},${ray.dir},${ray.color}`;
    if (visited.has(key)) continue;
    visited.add(key);

    for (let step = 1; step <= 20; step++) {
      const nc = ray.c + DIR_DX[ray.dir] * step;
      const nr = ray.r + DIR_DY[ray.dir] * step;
      if (nc < 0 || nc >= 16 || nr < 0 || nr >= 9) break;
      const blocker = items.find((it) => it.c === nc && it.r === nr && it.type !== "pad");
      if (!blocker) continue;
      if (blocker.type === "wall" || blocker.type === "emitter") break;
      if (blocker.type === "gate") {
        if (!blocker.open) break;
        continue;
      }
      if (blocker.type === "prism") {
        queue.push({ c: nc, r: nr, dir: blocker.dir, color: ray.color, depth: ray.depth + 1 });
        break;
      }
      if (blocker.type === "splitter") {
        queue.push({ c: nc, r: nr, dir: blocker.dir, color: ray.color, depth: ray.depth + 1 });
        queue.push({ c: nc, r: nr, dir: (blocker.dir + 2) % 4, color: ray.color, depth: ray.depth + 1 });
        break;
      }
      if (blocker.type === "chromatic") {
        queue.push({
          c: nc,
          r: nr,
          dir: blocker.dir,
          color: ray.color === "white" ? "cyan" : ray.color,
          depth: ray.depth + 1,
        });
        queue.push({
          c: nc,
          r: nr,
          dir: (blocker.dir + 1) % 4,
          color: ray.color === "white" ? "magenta" : ray.color,
          depth: ray.depth + 1,
        });
        break;
      }
      if (blocker.type === "shifter") {
        queue.push({ c: nc, r: nr, dir: ray.dir, color: blocker.color, depth: ray.depth + 1 });
        break;
      }
      if (blocker.type === "resonator") {
        if (blocker.color === ray.color || ray.color === "white") {
          blocker.energized = true;
        }
        break;
      }
    }
  }

  const resonators = items.filter((i) => i.type === "resonator");
  return resonators.every((r) => r.energized);
}

for (const sec of SECTORS) {
  const ok = simulateSector(sec, SOLUTIONS[sec.id] || {});
  if (!ok) {
    throw new Error(`Sector ${sec.id} (${sec.name}) failed solvability simulation!`);
  }
}

for (let w = 1; w <= 5; w++) {
  const wave = generateEndlessSector(w);
  const ok = simulateSector(wave, { 1: 1, 2: 0 });
  if (!ok) {
    throw new Error(`Endless wave ${w} failed solvability simulation!`);
  }
}

console.log("All 12 sectors and 5 endless waves passed optical solvability unit tests!");

try {
  const valOut = execFileSync("arc", ["validate", "--json"], { encoding: "utf-8" });
  console.log("arc validate --json:", valOut);
} catch (err) {
  console.error("arc validate error:", err.stdout || err.message);
  process.exit(1);
}

try {
  const inspOut = execFileSync("arc", ["inspect", "--json"], { encoding: "utf-8" });
  console.log("arc inspect --json:", inspOut);
} catch (err) {
  console.error("arc inspect error:", err.stdout || err.message);
  process.exit(1);
}
