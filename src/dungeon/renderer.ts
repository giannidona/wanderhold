import type { GameState } from '../types';
import { enemyColor } from './enemies';

const BG = '#241f2e';
const PLAYER_COLOR = '#e0b34d';
const TEXT_COLOR = '#eae6da';

export function renderDungeon(ctx: CanvasRenderingContext2D, state: GameState): void {
  const canvas = ctx.canvas;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const run = state.dungeon;
  if (!run) return;

  const midY = canvas.height / 2;

  drawCombatant(ctx, canvas.width * 0.28, midY, PLAYER_COLOR, 'Vos', run.playerHp, run.playerMaxHp);

  const enemy = run.enemies[run.currentEnemyIndex];
  if (enemy) {
    drawCombatant(ctx, canvas.width * 0.72, midY, enemyColor(enemy.kind), enemy.label, enemy.hp, enemy.maxHp);
  }

  if (run.outcome === 'victory') {
    drawBanner(ctx, canvas, '¡Mazmorra despejada!', '#7fd88f');
  } else if (run.outcome === 'defeat') {
    drawBanner(ctx, canvas, 'Caíste en combate...', '#e08b7d');
  }

  const previewY = canvas.height - 36;
  const upcoming = run.enemies.slice(run.currentEnemyIndex, run.currentEnemyIndex + 5);
  upcoming.forEach((e, i) => {
    const cx = 40 + i * 34;
    ctx.fillStyle = i === 0 ? enemyColor(e.kind) : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx, previewY, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBanner(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, color: string): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 100);
  ctx.textAlign = 'left';
}

function drawCombatant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  hp: number,
  maxHp: number
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 50);

  const barWidth = 90;
  const barX = x - barWidth / 2;
  const barY = y + 48;
  const ratio = Math.max(hp, 0) / maxHp;

  ctx.fillStyle = '#3a3d45';
  ctx.fillRect(barX, barY, barWidth, 10);
  ctx.fillStyle = ratio > 0.4 ? '#5fae5f' : '#c25b4b';
  ctx.fillRect(barX, barY, barWidth * ratio, 10);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '11px sans-serif';
  ctx.fillText(`${Math.max(hp, 0)}/${maxHp}`, x, barY + 22);
  ctx.textAlign = 'left';
}
