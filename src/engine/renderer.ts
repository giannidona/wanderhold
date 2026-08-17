import type { BuildingKind, GameState } from '../types';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';
import { isImageReady, sprites } from './sprites';

export { TILE_SIZE };

const COLORS = {
  grass: '#3d6b35',
  grassAlt: '#356030',
  hitLabel: 'rgba(0,0,0,0.65)',
  pendingTile: 'rgba(224, 179, 77, 0.35)',
  playerFallback: '#e0b34d',
};

export function setupCanvas(canvas: HTMLCanvasElement, gridSize: number): void {
  canvas.width = gridSize * TILE_SIZE;
  canvas.height = gridSize * TILE_SIZE;
}

// Proporción de tiles que usan la variante B de pasto. Un damero estricto
// (50/50 alternado) se lee como un enrejado mecánico a escala real porque
// los dos tonos son bastante distintos entre sí; con la variante B como
// acento disperso y minoritario en vez de la mitad del mapa, se lee como
// variación natural del pasto en vez de un patrón.
const GRASS_B_RATIO = 0.12;

// Hash entero determinístico por tile (mismo x,y siempre da el mismo
// resultado, así el pasto no "parpadea" entre frames). Evitamos alternar
// por paridad (x+y)%2 o usar Math.sin como hash porque ambos generan
// patrones de bloques grandes visibles en vez de puntos dispersos.
function tileHash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 0xffffffff;
}

function grassTile(x: number, y: number): HTMLImageElement {
  return tileHash(x, y) < GRASS_B_RATIO ? sprites.grassB : sprites.grassA;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.imageSmoothingEnabled = false;
  const size = state.village.gridSize;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tile = grassTile(x, y);
      if (isImageReady(tile)) {
        ctx.drawImage(tile, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = tile === sprites.grassB ? COLORS.grassAlt : COLORS.grass;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  if (state.pendingBuildTile) {
    const { x, y } = state.pendingBuildTile;
    ctx.fillStyle = COLORS.pendingTile;
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = COLORS.playerFallback;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  const pickaxeLevel = state.player.tools.pickaxeLevel;

  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining <= 0) continue;
    const px = node.x * TILE_SIZE;
    const py = node.y * TILE_SIZE;

    const sprite = node.kind === 'wood' ? sprites.tree : node.kind === 'stone' ? sprites.rock : sprites.iron;
    if (isImageReady(sprite)) {
      ctx.drawImage(sprite, px, py, TILE_SIZE, TILE_SIZE);
    }

    if (node.kind === 'stone' && pickaxeLevel < 1) drawLockIcon(ctx, px + 16, py + 9);
    if (node.kind === 'iron' && pickaxeLevel < 2) drawLockIcon(ctx, px + 16, py + 9);

    ctx.fillStyle = COLORS.hitLabel;
    ctx.font = '9px sans-serif';
    ctx.fillText(String(node.hitsRemaining), px + 23, py + 30);
  }

  for (const building of state.village.buildings) {
    drawBuilding(ctx, building.x * TILE_SIZE, building.y * TILE_SIZE, building.kind);
  }

  const p = state.player;

  if (isImageReady(sprites.player)) {
    if (p.facingDir === -1) {
      // Espeja el sprite en X: movemos el origen al centro del personaje,
      // invertimos la escala horizontal, y dibujamos offseteado hacia
      // atrás para que quede centrado igual que en el caso sin espejar.
      ctx.save();
      ctx.translate(p.px, p.py);
      ctx.scale(-1, 1);
      ctx.drawImage(sprites.player, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    } else {
      ctx.drawImage(sprites.player, p.px - TILE_SIZE / 2, p.py - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    }
  } else {
    ctx.fillStyle = COLORS.playerFallback;
    ctx.beginPath();
    ctx.arc(p.px, p.py, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLockIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.strokeStyle = 'rgba(15,15,15,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 3, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15,15,15,0.85)';
  ctx.fillRect(cx - 4, cy - 1, 8, 6);
}

function drawBuilding(ctx: CanvasRenderingContext2D, px: number, py: number, kind: BuildingKind): void {
  const sprite = kind === 'workshop' ? sprites.workshop : kind === 'forge' ? sprites.forge : sprites.hut;
  if (isImageReady(sprite)) {
    ctx.drawImage(sprite, px, py, TILE_SIZE, TILE_SIZE);
  }
}
