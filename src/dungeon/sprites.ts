import dungeonFloorA from '../assets/sprites/dungeon-floor-a.png';
import dungeonFloorB from '../assets/sprites/dungeon-floor-b.png';
import playerBattle from '../assets/sprites/player-battle.png';
import enemySlime from '../assets/sprites/enemy-slime.png';
import enemyBandit from '../assets/sprites/enemy-bandit.png';
import enemyWolf from '../assets/sprites/enemy-wolf.png';

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

// Los pisos son tiles 32x32 (mismo criterio que el pasto de la aldea). Los
// demás son PNG recortados al bounding box del sujeto, con alturas propias
// (no cuadrados) — se dibujan ancladas por el borde inferior en dungeon
// renderer.ts, no estiradas a un tile fijo.
export const dungeonSprites = {
  floorA: loadImage(dungeonFloorA),
  floorB: loadImage(dungeonFloorB),
  playerBattle: loadImage(playerBattle),
  slime: loadImage(enemySlime),
  bandit: loadImage(enemyBandit),
  wolf: loadImage(enemyWolf),
};

export function isImageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
