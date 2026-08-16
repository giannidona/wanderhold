import type { DungeonRunState, EnemyKind, GameState } from '../types';

const BG_DARK = '#1a1620';
const BG_LIGHT = '#221c2b';
const WALL_COLOR = '#332a40';
const PLAYER_BODY = '#e0b34d';
const PLAYER_HEAD = '#f0c968';
const TEXT_COLOR = '#eae6da';

export function renderDungeon(ctx: CanvasRenderingContext2D, state: GameState): void {
  const canvas = ctx.canvas;
  const run = state.dungeon;
  if (!run) return;

  drawBackground(ctx, canvas);

  const midY = canvas.height / 2 + 10;

  drawPlayer(ctx, canvas.width * 0.28, midY);
  drawHpBar(ctx, canvas.width * 0.28, midY + 46, run.playerHp, run.playerMaxHp, 'Vos');

  const enemy = run.enemies[run.currentEnemyIndex];
  if (enemy && !run.outcome) {
    drawEnemy(ctx, canvas.width * 0.72, midY, enemy.kind);
    drawHpBar(ctx, canvas.width * 0.72, midY + 46, enemy.hp, enemy.maxHp, enemy.label);
  }

  drawUpcomingQueue(ctx, canvas, run);
}

function drawBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const tile = 32;
  for (let y = 0; y < canvas.height; y += tile) {
    for (let x = 0; x < canvas.width; x += tile) {
      ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? BG_DARK : BG_LIGHT;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(0, 0, canvas.width, 14);
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = PLAYER_BODY;
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 26);
  ctx.lineTo(x - 10, y - 2);
  ctx.lineTo(x + 10, y - 2);
  ctx.lineTo(x + 14, y + 26);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PLAYER_HEAD;
  ctx.beginPath();
  ctx.arc(x, y - 14, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5a4326';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 6);
  ctx.lineTo(x + 25, y + 15);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, kind: EnemyKind): void {
  if (kind === 'slime') drawSlime(ctx, x, y);
  else if (kind === 'bandit') drawBandit(ctx, x, y);
  else drawWolf(ctx, x, y);
}

function drawSlime(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#3f8f45';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5fbf65';
  ctx.beginPath();
  ctx.arc(x - 8, y, 6, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#12100a';
  ctx.beginPath();
  ctx.arc(x - 6, y + 8, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, y + 8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBandit(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#6b2521';
  ctx.beginPath();
  ctx.moveTo(x - 13, y + 26);
  ctx.lineTo(x - 9, y - 2);
  ctx.lineTo(x + 9, y - 2);
  ctx.lineTo(x + 13, y + 26);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b0413e';
  ctx.beginPath();
  ctx.arc(x, y - 14, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#cfcfcf';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 4);
  ctx.lineTo(x - 22, y + 12);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawWolf(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5d6772';
  ctx.beginPath();
  ctx.ellipse(x - 4, y + 16, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(x - 20, y + 22, 5, 10);
  ctx.fillRect(x + 6, y + 22, 5, 10);

  ctx.fillStyle = '#6c7a89';
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 6, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 11, y);
  ctx.lineTo(x + 14, y - 11);
  ctx.lineTo(x + 18, y - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#12100a';
  ctx.beginPath();
  ctx.arc(x + 24, y + 4, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  label: string
): void {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 8);

  const barWidth = 90;
  const barX = x - barWidth / 2;
  const ratio = Math.max(hp, 0) / maxHp;

  ctx.fillStyle = '#3a3d45';
  ctx.fillRect(barX, y, barWidth, 10);
  ctx.fillStyle = ratio > 0.4 ? '#5fae5f' : '#c25b4b';
  ctx.fillRect(barX, y, barWidth * ratio, 10);

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
  });
}

function enemyTint(kind: EnemyKind): string {
  if (kind === 'slime') return '#4caf50';
  if (kind === 'bandit') return '#b0413e';
  return '#6c7a89';
}
