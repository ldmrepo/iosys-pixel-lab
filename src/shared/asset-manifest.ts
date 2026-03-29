import type { AssetManifest, CharacterSprite, SpriteAnimation, AgentStatus } from './types';

/**
 * Sprite sheet layout (MetroCity CC0 composited):
 *   4 columns x 7 rows, each frame 32x32  (sheet = 128x224)
 *   Row 0: idle      (frames 0,1)        — down idle1, idle2
 *   Row 1: typing    (frames 4,5,6,7)    — down idle1, idle2, idle1, idle2
 *   Row 2: reading   (frames 8,9)        — down idle1, idle2
 *   Row 3: executing (frames 12,13,14,15)— down walk1..walk4
 *   Row 4: waiting   (frames 16,17)      — down idle1, idle2
 *   Row 5: done      (frames 20,21)      — down idle1, idle2
 *   Row 6: error     (frames 24,25)      — down idle1, idle2
 *
 * Frame index = row * 4 + col
 */

function anim(frames: number[], fps: number, loop: boolean): SpriteAnimation {
  return { frames, fps, loop };
}

const standardAnimations: Record<AgentStatus, SpriteAnimation> = {
  idle:      anim([0, 1], 2, true),
  typing:    anim([4, 5, 6, 7], 6, true),
  reading:   anim([8, 9], 3, true),
  executing: anim([12, 13, 14, 15], 8, true),
  waiting:   anim([16, 17], 2, true),
  done:      anim([20, 21], 2, false),
  error:     anim([24, 25], 4, true),
};

function characterSprite(id: string): CharacterSprite {
  return {
    sheetUrl: `/assets/sprites/${id}.png`,
    frameWidth: 32,
    frameHeight: 32,
    animations: standardAnimations,
  };
}

export const assetManifest: AssetManifest = {
  tileSheet: {
    url: '/assets/tiles/office-tiles.png',
    tileSize: 16,
    columns: 8,
  },
  characters: {
    default: characterSprite('claude'),
    claude: characterSprite('claude'),
    codex: characterSprite('codex'),
    gemini: characterSprite('gemini'),
  },
};
