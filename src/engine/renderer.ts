import type { BuildingKind, GameState } from '../types';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';

export { TILE_SIZE };

const COLORS = {
  grass: '#3d6b35',
  grassAlt: '#356030',
  wood: '#6b4226',
  woodTop: '#3f7d3f',
  stone: '#7a7a7a',
  stoneShadow: '#5c5c5c',
  iron: '#8a8a8a',
  ironFleck: '#c9701f',
  player: '#e0b34d',
  playerFacing: '#3a2a10',
  hitLabel: 'rgba(0,0,0,0.65)',
  workshop: '#7a5230',
  workshopRoof: '#c98a4b',
  hut: '#5a4a6b',
  hutRoof: '#8f7ab5',
  forge: '#4a4a4a',
  forgeRoof: '#3a3a3a',
  forgeEmber: 'rgba(255,140,40,0.85)',
  pendingTile: 'rgba(224, 179, 77, 0.35)',
};

export function setupCanvas(canvas: HTMLCanvasElement, gridSize: number): void {
  canvas.width = gridSize * TILE_SIZE;
  canvas.height = gridSize * TILE_SIZE;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const size = state.village.gridSize;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassAlt;
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  if (state.pendingBuildTile) {
    const { x, y } = state.pendingBuildTile;
    ctx.fillStyle = COLORS.pendingTile;
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = COLORS.player;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  const pickaxeLevel = state.player.tools.pickaxeLevel;

  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining <= 0) continue;
    const px = node.x * TILE_SIZE;
    const py = node.y * TILE_SIZE;

    if (node.kind === 'wood') {
      ctx.fillStyle = COLORS.wood;
      ctx.fillRect(px + 13, py + 16, 6, 14);
      ctx.fillStyle = COLORS.woodTop;
      ctx.beginPath();
      ctx.arc(px + 16, py + 12, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.kind === 'stone') {
      ctx.fillStyle = COLORS.stoneShadow;
      ctx.beginPath();
      ctx.ellipse(px + 17, py + 21, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.stone;
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 19, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (pickaxeLevel < 1) drawLockIcon(ctx, px + 16, py + 9);
    } else {
      ctx.fillStyle = COLORS.stoneShadow;
      ctx.beginPath();
      ctx.ellipse(px + 17, py + 21, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.iron;
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 19, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.ironFleck;
      ctx.beginPath();
      ctx.arc(px + 12, py + 18, 1.6, 0, Math.PI * 2);
      ctx.arc(px + 20, py + 21, 1.6, 0, Math.PI * 2);
      ctx.arc(px + 16, py + 15, 1.6, 0, Math.PI * 2);
      ctx.fill();

      if (pickaxeLevel < 2) drawLockIcon(ctx, px + 16, py + 9);
    }

    ctx.fillStyle = COLORS.hitLabel;
    ctx.font = '9px sans-serif';
    ctx.fillText(String(node.hitsRemaining), px + 23, py + 30);
  }

  for (const building of state.village.buildings) {
    drawBuilding(ctx, building.x * TILE_SIZE, building.y * TILE_SIZE, building.kind);
  }

  const p = state.player;

  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.px, p.py, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.playerFacing;
  ctx.beginPath();
  ctx.arc(p.px + p.facing.x * 10, p.py + p.facing.y * 10, 3, 0, Math.PI * 2);
  ctx.fill();
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
  const bodyColor = kind === 'workshop' ? COLORS.workshop : kind === 'forge' ? COLORS.forge : COLORS.hut;
  const roofColor = kind === 'workshop' ? COLORS.workshopRoof : kind === 'forge' ? COLORS.forgeRoof : COLORS.hutRoof;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(px + 5, py + 14, TILE_SIZE - 10, TILE_SIZE - 18);

  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(px + 3, py + 15);
  ctx.lineTo(px + TILE_SIZE / 2, py + 4);
  ctx.lineTo(px + TILE_SIZE - 3, py + 15);
  ctx.closePath();
  ctx.fill();

  if (kind === 'forge') {
    ctx.fillStyle = COLORS.forgeEmber;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + 9, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
