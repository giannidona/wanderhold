import type { DungeonRunState, EnemyKind, GameState } from '../types';
import { dungeonSprites, isImageReady } from './sprites';

const WALL_COLOR = '#332a40';
const TEXT_COLOR = '#eae6da';
const FLOOR_TILE = 32;

// Misma técnica que el pasto de la aldea: hash entero determinístico por
// tile para que la variante "musgo" (floorB) aparezca como acento disperso
// en vez de una alternancia mecánica.
const FLOOR_B_RATIO = 0.15;

function tileHash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 0xffffffff;
}

// Ancla vertical compartida por personaje/enemigos: todos los sprites
// están recortados al bounding box real del sujeto, así que dibujarlos
// con el mismo offset de "piso" alcanza para que los pies de todos
// queden a la misma altura sin necesitar ajustar caso por caso.
const GROUND_OFFSET = 20;
const BOSS_COLOR = '#e8c15a';
const BOSS_SCALE = 1.4;

function drawGrounded(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerX: number,
  groundY: number,
  scale = 1,
  glow = false
): void {
  if (!isImageReady(img)) return;
  const w = img.width * scale;
  const h = img.height * scale;

  if (glow) {
    ctx.save();
    ctx.shadowColor = BOSS_COLOR;
    ctx.shadowBlur = 20;
  }
  ctx.drawImage(img, centerX - w / 2, groundY - h + GROUND_OFFSET * scale, w, h);
  if (glow) ctx.restore();
}

export function renderDungeon(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.imageSmoothingEnabled = false;
  const canvas = ctx.canvas;
  const run = state.dungeon;
  if (!run) return;

  drawBackground(ctx, canvas);

  const midY = canvas.height / 2 + 10;

  drawGrounded(ctx, dungeonSprites.playerBattle, canvas.width * 0.28, midY);
  drawHpBar(ctx, canvas.width * 0.28, midY + 46, run.playerHp, run.playerMaxHp, 'Vos');

  const enemy = run.enemies[run.currentEnemyIndex];
  if (enemy && !run.outcome) {
    const scale = enemy.isBoss ? BOSS_SCALE : 1;
    drawGrounded(ctx, enemySprite(enemy.kind), canvas.width * 0.72, midY, scale, enemy.isBoss);
    drawHpBar(ctx, canvas.width * 0.72, midY + 46, enemy.hp, enemy.maxHp, enemy.label, enemy.isBoss);
  }

  drawUpcomingQueue(ctx, canvas, run);
}

function enemySprite(kind: EnemyKind): HTMLImageElement {
  if (kind === 'slime') return dungeonSprites.slime;
  if (kind === 'bandit') return dungeonSprites.bandit;
  return dungeonSprites.wolf;
}

function drawBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  for (let y = 0; y < canvas.height; y += FLOOR_TILE) {
    for (let x = 0; x < canvas.width; x += FLOOR_TILE) {
      const gx = x / FLOOR_TILE;
      const gy = y / FLOOR_TILE;
      const tile = tileHash(gx, gy) < FLOOR_B_RATIO ? dungeonSprites.floorB : dungeonSprites.floorA;
      if (isImageReady(tile)) {
        ctx.drawImage(tile, x, y, FLOOR_TILE, FLOOR_TILE);
      }
    }
  }
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(0, 0, canvas.width, 14);
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  label: string,
  isBoss = false
): void {
  ctx.fillStyle = isBoss ? BOSS_COLOR : TEXT_COLOR;
  ctx.font = isBoss ? 'bold 12px sans-serif' : '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 8);

  const barWidth = 90;
  const barX = x - barWidth / 2;
  const ratio = Math.max(hp, 0) / maxHp;

  ctx.fillStyle = '#3a3d45';
  ctx.fillRect(barX, y, barWidth, 10);
  ctx.fillStyle = ratio > 0.4 ? '#5fae5f' : '#c25b4b';
  ctx.fillRect(barX, y, barWidth * ratio, 10);

  if (isBoss) {
    ctx.strokeStyle = BOSS_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 1, y - 1, barWidth + 2, 12);
  }

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '10px sans-serif';
  ctx.fillText(`${Math.max(hp, 0)}/${maxHp}`, x, y + 22);
  ctx.textAlign = 'left';
}

function drawUpcomingQueue(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, run: DungeonRunState): void {
  const y = canvas.height - 30;
  const upcoming = run.enemies.slice(run.currentEnemyIndex, run.currentEnemyIndex + 5);

  upcoming.forEach((e, i) => {
    const cx = 40 + i * 30;
    ctx.fillStyle = i === 0 && !run.outcome ? enemyTint(e.kind) : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx, y, 8, 0, Math.PI * 2);
    ctx.fill();

    if (e.isBoss) {
      ctx.strokeStyle = BOSS_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, y, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function enemyTint(kind: EnemyKind): string {
  if (kind === 'slime') return '#4caf50';
  if (kind === 'bandit') return '#b0413e';
  return '#6c7a89';
}
