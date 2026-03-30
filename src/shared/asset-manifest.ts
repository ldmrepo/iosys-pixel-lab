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
  furnitureSheets: {
    tilesHouse:    { url: '/assets/metrocity/Interior/Home/TilesHouse.png', name: 'House Tiles' },
    livingRoom1:   { url: '/assets/metrocity/Interior/Home/LivingRoom1-Sheet.png', name: 'Sofas' },
    livingRoom:    { url: '/assets/metrocity/Interior/Home/LivingRoom-Sheet.png', name: 'Living Room' },
    miscHome:      { url: '/assets/metrocity/Interior/Home/Miscellaneous-Sheet.png', name: 'Misc Home' },
    cupboard:      { url: '/assets/metrocity/Interior/Home/Cupboard-Sheet.png', name: 'Cupboards' },
    kitchen1:      { url: '/assets/metrocity/Interior/Home/Kitchen1-Sheet.png', name: 'Kitchen Chairs' },
    kitchen:       { url: '/assets/metrocity/Interior/Home/Kitchen-Sheet.png', name: 'Kitchen' },
    flowers:       { url: '/assets/metrocity/Interior/Home/Flowers-Sheet.png', name: 'Plants' },
    tv:            { url: '/assets/metrocity/Interior/Home/TV-Sheet.png', name: 'TVs' },
    carpet:        { url: '/assets/metrocity/Interior/Home/Carpet-Sheet.png', name: 'Carpets' },
    paintings:     { url: '/assets/metrocity/Interior/Home/Paintings-Sheet.png', name: 'Paintings' },
    paintings1:    { url: '/assets/metrocity/Interior/Home/Paintings1-Sheet.png', name: 'Paintings1' },
    lights:        { url: '/assets/metrocity/Interior/Home/Lights-Sheet.png', name: 'Lamps' },
    windows:       { url: '/assets/metrocity/Interior/Home/Windows-Sheet.png', name: 'Windows' },
    doors:         { url: '/assets/metrocity/Interior/Home/Doors-Sheet.png', name: 'Doors' },
    miscHospital:  { url: '/assets/metrocity/Interior/Hospital/Miscellaneous-Sheet.png', name: 'Hospital Misc' },
    beds1:          { url: '/assets/metrocity/Interior/Home/Beds1-Sheet.png',             name: 'Server Racks' },
    doorsHospital:  { url: '/assets/metrocity/Interior/Hospital/DoorsHospital-Sheet.png', name: 'Hospital Doors' },
    tilesHospital:  { url: '/assets/metrocity/Interior/Hospital/TilesHospital.png',       name: 'Hospital Tiles' },
    chimney:        { url: '/assets/metrocity/Interior/Home/Chimney-Sheet.png',           name: 'Modern Chimneys' },
    chimney1:       { url: '/assets/metrocity/Interior/Home/Chimney1-Sheet.png',          name: 'Classic Chimneys' },
    bathroom:       { url: '/assets/metrocity/Interior/Home/Bathroom-Sheet.png',          name: 'Bathroom' },
    beds:           { url: '/assets/metrocity/Interior/Home/Beds-Sheet.png',              name: 'Beds' },
    bedHospital:    { url: '/assets/metrocity/Interior/Hospital/BedHospital-Sheet.png',   name: 'Hospital Beds' },
  },
};
