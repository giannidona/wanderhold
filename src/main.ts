import './style.css';
import { setupCanvas, TILE_SIZE } from './engine/renderer';
import { startGameLoop } from './engine/loop';
import { renderHud } from './ui/hud';
import { state, subscribe, notify } from './state/store';
import { enterDungeon } from './dungeon';
import { isTileEmpty } from './state/village';
import { placeBuilding } from './state/buildings';
import { craftTool, type ToolKind } from './state/craft';
import type { BuildingKind } from './types';

const canvasEl = document.querySelector<HTMLCanvasElement>('#village-canvas');
const hudEl = document.querySelector<HTMLElement>('#hud');

if (!canvasEl || !hudEl) {
  throw new Error('Faltan elementos base en el DOM (#village-canvas / #hud).');
}

const canvas: HTMLCanvasElement = canvasEl;
const hud: HTMLElement = hudEl;

setupCanvas(canvas, state.village.gridSize);
const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('No se pudo obtener el contexto 2D del canvas.');
}

function draw(): void {
  renderHud(hud, state);
}

canvas.addEventListener('click', (e) => {
  if (state.scene !== 'village') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const tileX = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
  const tileY = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

  if (tileX < 0 || tileY < 0 || tileX >= state.village.gridSize || tileY >= state.village.gridSize) return;
  if (!isTileEmpty(state.village, tileX, tileY, state.player)) return;

  state.pendingBuildTile = { x: tileX, y: tileY };
  notify();
});

hud.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const buildBtn = target.closest<HTMLElement>('[data-build-kind]');
  const craftBtn = target.closest<HTMLElement>('[data-craft-tool]');

  if (target.id === 'enter-dungeon-btn' && state.scene === 'village') {
    enterDungeon(state);
    notify();
    return;
  }

  if (target.id === 'cancel-build-btn') {
    state.pendingBuildTile = null;
    notify();
    return;
  }

  if (buildBtn && state.pendingBuildTile) {
    const kind = buildBtn.dataset.buildKind as BuildingKind;
    const placed = placeBuilding(state, state.pendingBuildTile, kind);
    if (placed) state.pendingBuildTile = null;
    notify();
    return;
  }

  if (craftBtn) {
    const tool = craftBtn.dataset.craftTool as ToolKind;
    craftTool(state, tool);
    notify();
  }
});

subscribe(draw);
draw();

startGameLoop(ctx);
