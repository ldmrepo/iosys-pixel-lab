/**
 * composite-characters.ts
 *
 * Composites MetroCity character layers (Body + Outfit + Hair + Shadow)
 * into per-agent spritesheets compatible with the existing project layout.
 *
 * Source assets (MetroCity CC0):
 *   - CharacterModel/Character Model.png  (768x192) — 24 cols x 6 rows, 32x32 each
 *   - CharacterModel/Shadow.png           (32x32)
 *   - Hair/Hairs.png                      (768x256) — 24 cols x 8 rows, 32x32 each
 *   - Outfits/Outfit{N}.png              (768x32)  — 24 cols x 1 row, 32x32 each
 *
 * MetroCity frame layout (24 columns):
 *   Cols  0-5:  down  direction (idle 2 + walk 4)
 *   Cols  6-11: left  direction
 *   Cols 12-17: right direction
 *   Cols 18-23: up    direction
 *
 * Character Model rows:
 *   Row 0-2: light skin (3 variants)
 *   Row 3-5: dark skin  (3 variants)
 *
 * Hair mapping (individual Hair{N}.png matches Hairs.png row in reverse):
 *   Hair1 -> Hairs row 6  |  Hair2 -> Hairs row 5
 *   Hair3 -> Hairs row 4  |  Hair4 -> Hairs row 3
 *   Hair5 -> Hairs row 2  |  Hair6 -> Hairs row 1
 *   Hair7 -> Hairs row 0
 *
 * Output layout (4 cols x 7 rows, 32x32 per frame = 128x224):
 *   Row 0: idle      [down_idle1, down_idle2, down_idle1, down_idle2]
 *   Row 1: typing    [down_idle1, down_idle2, down_idle1, down_idle2]
 *   Row 2: reading   [down_idle1, down_idle2, -, -]
 *   Row 3: executing [down_walk1, down_walk2, down_walk3, down_walk4]
 *   Row 4: waiting   [down_idle1, down_idle2, -, -]
 *   Row 5: done      [down_idle1, down_idle2, -, -]
 *   Row 6: error     [down_idle1, down_idle2, -, -]
 *
 * MetroCity down-direction columns:
 *   Col 0 = idle1, Col 1 = idle2
 *   Col 2 = walk1, Col 3 = walk2, Col 4 = walk3, Col 5 = walk4
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Constants
// ============================================================

const FRAME = 32;
const OUT_COLS = 4;
const OUT_ROWS = 7;
const OUT_W = FRAME * OUT_COLS;  // 128
const OUT_H = FRAME * OUT_ROWS;  // 224

const MC_COLS = 24; // MetroCity spritesheet columns

// Hair number to Hairs.png row mapping (verified empirically)
const HAIR_TO_HAIRS_ROW: Record<number, number> = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
  7: 0,
};

// ============================================================
// Agent definitions
// ============================================================

interface AgentDef {
  id: string;
  bodyRow: number;    // Row in Character Model.png (0-5)
  hairNum: number;    // Hair number (1-7) -> maps to Hairs.png row
  outfitNum: number;  // Outfit number (1-6) -> Outfit{N}.png
}

const AGENTS: AgentDef[] = [
  { id: 'claude', bodyRow: 0, hairNum: 2, outfitNum: 5 },
  { id: 'codex',  bodyRow: 0, hairNum: 4, outfitNum: 3 },
  { id: 'gemini', bodyRow: 3, hairNum: 7, outfitNum: 2 },
];

// ============================================================
// PNG helpers
// ============================================================

function loadPNG(filePath: string): PNG {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function createPNG(w: number, h: number): PNG {
  const png = new PNG({ width: w, height: h });
  // Initialize to fully transparent
  png.data.fill(0);
  return png;
}

/** Alpha-composite src pixel over dst pixel (standard "over" operator) */
function alphaBlend(
  dst: Buffer,
  dstIdx: number,
  src: Buffer,
  srcIdx: number,
): void {
  const srcA = src[srcIdx + 3] / 255;
  if (srcA === 0) return; // fully transparent source, nothing to do

  if (srcA === 1) {
    // Fully opaque source, just overwrite
    dst[dstIdx]     = src[srcIdx];
    dst[dstIdx + 1] = src[srcIdx + 1];
    dst[dstIdx + 2] = src[srcIdx + 2];
    dst[dstIdx + 3] = 255;
    return;
  }

  const dstA = dst[dstIdx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA === 0) return;

  dst[dstIdx]     = Math.round((src[srcIdx]     * srcA + dst[dstIdx]     * dstA * (1 - srcA)) / outA);
  dst[dstIdx + 1] = Math.round((src[srcIdx + 1] * srcA + dst[dstIdx + 1] * dstA * (1 - srcA)) / outA);
  dst[dstIdx + 2] = Math.round((src[srcIdx + 2] * srcA + dst[dstIdx + 2] * dstA * (1 - srcA)) / outA);
  dst[dstIdx + 3] = Math.round(outA * 255);
}

/**
 * Copy a FRAME x FRAME tile from src spritesheet to dst at given position,
 * using alpha compositing (draws src "over" dst).
 */
function compositeFrame(
  dst: PNG,
  dstCol: number,
  dstRow: number,
  src: PNG,
  srcCol: number,
  srcRow: number,
): void {
  const sx = srcCol * FRAME;
  const sy = srcRow * FRAME;
  const dx = dstCol * FRAME;
  const dy = dstRow * FRAME;

  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      const srcIdx = ((sy + y) * src.width + (sx + x)) << 2;
      const dstIdx = ((dy + y) * dst.width + (dx + x)) << 2;
      alphaBlend(dst.data, dstIdx, src.data, srcIdx);
    }
  }
}

/**
 * Copy a single 32x32 tile (from a standalone 32x32 image like Shadow.png)
 * to a position in the destination, using alpha compositing.
 */
function compositeTile(
  dst: PNG,
  dstCol: number,
  dstRow: number,
  src: PNG,
): void {
  const dx = dstCol * FRAME;
  const dy = dstRow * FRAME;

  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      const srcIdx = (y * src.width + x) << 2;
      const dstIdx = ((dy + y) * dst.width + (dx + x)) << 2;
      alphaBlend(dst.data, dstIdx, src.data, srcIdx);
    }
  }
}

// ============================================================
// Output row mapping
// ============================================================

/**
 * For each output row, define which MetroCity down-direction columns
 * map to which output columns.
 *
 * MetroCity down direction: cols 0-5
 *   0=idle1, 1=idle2, 2=walk1, 3=walk2, 4=walk3, 5=walk4
 */
interface FrameMapping {
  outCol: number;
  srcCol: number; // MetroCity column (down direction: 0-5)
}

interface RowMapping {
  frames: FrameMapping[];
}

const OUTPUT_ROWS: RowMapping[] = [
  // Row 0: idle [idle1, idle2, idle1, idle2]
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }, { outCol: 2, srcCol: 0 }, { outCol: 3, srcCol: 1 }] },
  // Row 1: typing [idle1, idle2, idle1, idle2] (sitting animation reuses idle)
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }, { outCol: 2, srcCol: 0 }, { outCol: 3, srcCol: 1 }] },
  // Row 2: reading [idle1, idle2]
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }] },
  // Row 3: executing [walk1, walk2, walk3, walk4]
  { frames: [{ outCol: 0, srcCol: 2 }, { outCol: 1, srcCol: 3 }, { outCol: 2, srcCol: 4 }, { outCol: 3, srcCol: 5 }] },
  // Row 4: waiting [idle1, idle2]
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }] },
  // Row 5: done [idle1, idle2]
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }] },
  // Row 6: error [idle1, idle2]
  { frames: [{ outCol: 0, srcCol: 0 }, { outCol: 1, srcCol: 1 }] },
];

// ============================================================
// Main compositing logic
// ============================================================

function compositeAgent(agent: AgentDef, bodySheet: PNG, hairsSheet: PNG, outfitSheet: PNG, shadow: PNG): PNG {
  const out = createPNG(OUT_W, OUT_H);

  const hairsRow = HAIR_TO_HAIRS_ROW[agent.hairNum];

  for (let outRow = 0; outRow < OUTPUT_ROWS.length; outRow++) {
    const rowMap = OUTPUT_ROWS[outRow];
    for (const fm of rowMap.frames) {
      // Layer order (bottom to top): Shadow -> Body -> Outfit -> Hair

      // 1. Shadow
      compositeTile(out, fm.outCol, outRow, shadow);

      // 2. Body (from Character Model.png)
      compositeFrame(out, fm.outCol, outRow, bodySheet, fm.srcCol, agent.bodyRow);

      // 3. Outfit
      compositeFrame(out, fm.outCol, outRow, outfitSheet, fm.srcCol, 0);

      // 4. Hair (from Hairs.png)
      compositeFrame(out, fm.outCol, outRow, hairsSheet, fm.srcCol, hairsRow);
    }
  }

  return out;
}

// ============================================================
// Entry point
// ============================================================

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const assetBase = path.join(projectRoot, 'public', 'assets', 'metrocity');
  const outDir = path.join(projectRoot, 'public', 'assets', 'sprites');

  fs.mkdirSync(outDir, { recursive: true });

  // Load shared assets
  console.log('[composite] Loading shared assets...');
  const bodySheet = loadPNG(path.join(assetBase, 'CharacterModel', 'Character Model.png'));
  const hairsSheet = loadPNG(path.join(assetBase, 'Hair', 'Hairs.png'));
  const shadow = loadPNG(path.join(assetBase, 'CharacterModel', 'Shadow.png'));

  console.log(`[composite] Body sheet: ${bodySheet.width}x${bodySheet.height}`);
  console.log(`[composite] Hairs sheet: ${hairsSheet.width}x${hairsSheet.height}`);
  console.log(`[composite] Shadow: ${shadow.width}x${shadow.height}`);

  for (const agent of AGENTS) {
    console.log(`[composite] Building ${agent.id}...`);
    console.log(`  Body row=${agent.bodyRow}, Hair${agent.hairNum} (Hairs row=${HAIR_TO_HAIRS_ROW[agent.hairNum]}), Outfit${agent.outfitNum}`);

    // Load per-agent outfit
    const outfitSheet = loadPNG(path.join(assetBase, 'Outfits', `Outfit${agent.outfitNum}.png`));

    const result = compositeAgent(agent, bodySheet, hairsSheet, outfitSheet, shadow);

    const outPath = path.join(outDir, `${agent.id}.png`);
    const buffer = PNG.sync.write(result);
    fs.writeFileSync(outPath, buffer);

    console.log(`  -> ${outPath} (${OUT_W}x${OUT_H})`);
  }

  console.log('[composite] Done. All agent spritesheets generated.');
}

main().catch((err) => {
  console.error('[composite] Error:', err);
  process.exit(1);
});
