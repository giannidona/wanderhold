import type { BuildingKind, GameState } from '../types';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';
import { isImageReady, sprites } from './sprites';
import { isPlayerTouchingNode } from './gather';
import { drawFloatingTexts } from './floatingText';
import { getNodesInTileRange } from '../state/village';

export { TILE_SIZE };

const COLORS = {
  grass: '#3d6b35',
  grassAlt: '#356030',
  hitLabel: 'rgba(0,0,0,0.65)',
  pendingTile: 'rgba(224, 179, 77, 0.35)',
  playerFallback: '#e0b34d',
  nodeHpBarBg: 'rgba(15, 15, 15, 0.75)',
  nodeHpBarFill: '#8bd17c',
  nodeHpBarFillLow: '#d17c6c',
};

// El canvas ahora es un viewport fijo, no "todo el mapa" — con mundo
// infinito ya no hay un tamaño de mapa que darle. La cámara sigue siempre
// al jugador (centrado), y solo se dibuja lo que entra en este rectángulo
// más un margen de 1 tile, así el costo de renderizar es constante sin
// importar cuánto mundo se haya explorado.
const VIEWPORT_TILES_X = 24;
const VIEWPORT_TILES_Y = 20;

export function setupCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = VIEWPORT_TILES_X * TILE_SIZE;
  canvas.height = VIEWPORT_TILES_Y * TILE_SIZE;
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
  const canvas = ctx.canvas;

  // Cámara: esquina superior izquierda del viewport en coordenadas de
  // mundo. El jugador siempre queda dibujado en el centro exacto del
  // canvas; todo lo demás se dibuja restando este offset.
  const camX = state.player.px - canvas.width / 2;
  const camY = state.player.py - canvas.height / 2;

  const startTileX = Math.floor(camX / TILE_SIZE) - 1;
  const endTileX = Math.floor((camX + canvas.width) / TILE_SIZE) + 1;
  const startTileY = Math.floor(camY / TILE_SIZE) - 1;
  const endTileY = Math.floor((camY + canvas.height) / TILE_SIZE) + 1;

  for (let y = startTileY; y <= endTileY; y++) {
    for (let x = startTileX; x <= endTileX; x++) {
      const tile = grassTile(x, y);
      const screenX = x * TILE_SIZE - camX;
      const screenY = y * TILE_SIZE - camY;
      if (isImageReady(tile)) {
        ctx.drawImage(tile, screenX, screenY, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = tile === sprites.grassB ? COLORS.grassAlt : COLORS.grass;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  if (state.pendingBuildTile) {
    const { x, y } = state.pendingBuildTile;
    const screenX = x * TILE_SIZE - camX;
    const screenY = y * TILE_SIZE - camY;
    ctx.fillStyle = COLORS.pendingTile;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = COLORS.playerFallback;
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  const pickaxeLevel = state.player.tools.pickaxeLevel;
  const visibleNodes = getNodesInTileRange(state.village, startTileX, endTileX, startTileY, endTileY);

  for (const node of visibleNodes) {
    if (node.hitsRemaining <= 0) continue;
    const px = node.x * TILE_SIZE - camX;
    const py = node.y * TILE_SIZE - camY;

    const sprite = node.kind === 'wood' ? sprites.tree : node.kind === 'stone' ? sprites.rock : sprites.iron;
    if (isImageReady(sprite)) {
      ctx.drawImage(sprite, px, py, TILE_SIZE, TILE_SIZE);
    }

    if (node.kind === 'stone' && pickaxeLevel < 1) drawLockIcon(ctx, px + 16, py + 9);
    if (node.kind === 'iron' && pickaxeLevel < 2) drawLockIcon(ctx, px + 16, py + 9);

    // La "vida" del nodo (golpes restantes) solo se muestra mientras el
    // jugador lo está tocando/minando, para no saturar el mapa con barras
    // sobre árboles/rocas todavía intactos que nadie está atacando.
    if (isPlayerTouchingNode(state, node)) {
      drawNodeHpBar(ctx, px, py, node.hitsRemaining, node.maxHits);
    }
  }

  for (const building of state.village.buildings) {
    const worldX = building.x * TILE_SIZE;
    const worldY = building.y * TILE_SIZE;
    // Descarte barato de edificios fuera de cámara (el array de edificios
    // es global, no está indexado por chunk como los recursos).
    if (
      worldX + TILE_SIZE < camX ||
      worldX > camX + canvas.width ||
      worldY + TILE_SIZE < camY ||
      worldY > camY + canvas.height
    ) {
      continue;
    }
    drawBuilding(ctx, worldX - camX, worldY - camY, building.kind);
  }

  // El jugador siempre se dibuja en el centro del viewport — es la cámara
  // la que se mueve, no él.
  const p = state.player;
  const screenPx = canvas.width / 2;
  const screenPy = canvas.height / 2;

  if (isImageReady(sprites.player)) {
    // El sprite base mira hacia la izquierda, así que hay que espejarlo
    // cuando el jugador se mueve a la derecha (facingDir=1), no al revés.
    if (p.facingDir === 1) {
      // Espeja el sprite en X: movemos el origen al centro del personaje,
      // invertimos la escala horizontal, y dibujamos offseteado hacia
      // atrás para que quede centrado igual que en el caso sin espejar.
      ctx.save();
      ctx.translate(screenPx, screenPy);
      ctx.scale(-1, 1);
      ctx.drawImage(sprites.player, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    } else {
      ctx.drawImage(sprites.player, screenPx - TILE_SIZE / 2, screenPy - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    }
  } else {
    ctx.fillStyle = COLORS.playerFallback;
    ctx.beginPath();
    ctx.arc(screenPx, screenPy, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // Siempre al final, por encima de todo lo demás (jugador incluido), así
  // el "+n" de un recurso recién recolectado nunca queda tapado. Los
  // textos flotantes están en coordenadas de mundo, por eso necesitan el
  // mismo offset de cámara que todo lo demás.
  drawFloatingTexts(ctx, camX, camY);

  // Coordenadas in-game, ancladas a la esquina del viewport (no siguen la
  // cámara, van siempre en el mismo lugar en pantalla) — antes vivían en
  // el HUD al costado, se movieron acá para no tener que mirar afuera del
  // juego para saber dónde estás parado.
  drawCoordsOverlay(ctx, state);
}

function drawCoordsOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const tileX = Math.floor(state.player.px / TILE_SIZE);
  const tileY = Math.floor(state.player.py / TILE_SIZE);
  const label = `(${tileX}, ${tileY})`;

  ctx.font = 'bold 12px sans-serif';
  const paddingX = 8;
  const textWidth = ctx.measureText(label).width;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = 20;
  const boxX = 8;
  const boxY = 8;

  ctx.fillStyle = 'rgba(15, 15, 15, 0.55)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = '#eae6da';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, boxX + paddingX, boxY + boxHeight / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawNodeHpBar(ctx: CanvasRenderingContext2D, px: number, py: number, hits: number, maxHits: number): void {
  const barWidth = TILE_SIZE - 6;
  const barX = px + 3;
  const barY = py + 3;
  const ratio = Math.max(hits, 0) / maxHits;

  ctx.fillStyle = COLORS.nodeHpBarBg;
  ctx.fillRect(barX, barY, barWidth, 5);
  ctx.fillStyle = ratio > 0.4 ? COLORS.nodeHpBarFill : COLORS.nodeHpBarFillLow;
  ctx.fillRect(barX, barY, barWidth * ratio, 5);

  // Texto con contorno oscuro para que se lea igual de bien sobre pasto,
  // piedra o cualquier sprite de fondo.
  const label = `${hits}/${maxHits}`;
  const textX = px + TILE_SIZE / 2;
  const textY = py + 20;
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(label, textX, textY);
  ctx.fillStyle = '#eae6da';
  ctx.fillText(label, textX, textY);
  ctx.textAlign = 'left';
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
