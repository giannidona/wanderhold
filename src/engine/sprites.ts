import tileGrassA from '../assets/sprites/tile-grass-a.png';
import tileGrassB from '../assets/sprites/tile-grass-b.png';
import resourceTree from '../assets/sprites/resource-tree.png';
import resourceRock from '../assets/sprites/resource-rock.png';
import resourceIron from '../assets/sprites/resource-iron.png';
import buildingWorkshop from '../assets/sprites/building-workshop.png';
import buildingForge from '../assets/sprites/building-forge.png';
import buildingHut from '../assets/sprites/building-hut.png';
import playerVillage from '../assets/sprites/player-village.png';

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

// Todos los sprites son PNG 32x32 con fondo transparente, recortados al
// bounding box del sujeto y centrados en el canvas (ver ART_PROMPTS.md).
// Al ser cuadrados de 32x32 ya se pueden dibujar 1:1 sobre cada tile sin
// cálculos de aspect ratio.
export const sprites = {
  grassA: loadImage(tileGrassA),
  grassB: loadImage(tileGrassB),
  tree: loadImage(resourceTree),
  rock: loadImage(resourceRock),
  iron: loadImage(resourceIron),
  workshop: loadImage(buildingWorkshop),
  forge: loadImage(buildingForge),
  hut: loadImage(buildingHut),
  player: loadImage(playerVillage),
};

export function isImageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
