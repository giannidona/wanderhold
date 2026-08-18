import './style.css';
import { setupCanvas } from './engine/renderer';
import { startGameLoop } from './engine/loop';
import { renderHud } from './ui/hud';
import { renderHotbar } from './ui/hotbar';
import { renderDungeonResult } from './ui/dungeonResult';
import { initToasts } from './ui/toasts';
import { state, subscribe, notify } from './state/store';
import { enterDungeon, exitDungeon } from './dungeon';
import { isTileFree } from './state/village';
import { placeBuilding } from './state/buildings';
import { craftArmor, craftTool, type ArmorSlot, type ToolKind } from './state/craft';
import { choosePerk } from './state/progression';
import { circleRectOverlap, tileRect } from './engine/collision';
import { saveGame } from './state/save';
import { PLAYER_RADIUS, TILE_SIZE } from './constants';
import type { BuildingKind, PerkKind } from './types';

const canvasEl = document.querySelector<HTMLCanvasElement>('#village-canvas');
const hudEl = document.querySelector<HTMLElement>('#hud');
const hotbarEl = document.querySelector<HTMLElement>('#hotbar');
const dungeonResultEl = document.querySelector<HTMLElement>('#dungeon-result');
const toastsEl = document.querySelector<HTMLElement>('#toasts');

if (!canvasEl || !hudEl || !hotbarEl || !dungeonResultEl || !toastsEl) {
  throw new Error('Faltan elementos base en el DOM (#village-canvas / #hud / #hotbar / #dungeon-result / #toasts).');
}

const canvas: HTMLCanvasElement = canvasEl;
const hud: HTMLElement = hudEl;
const hotbar: HTMLElement = hotbarEl;
const dungeonResult: HTMLElement = dungeonResultEl;

initToasts(toastsEl);
setupCanvas(canvas, state.village.gridSize);
const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('No se pudo obtener el contexto 2D del canvas.');
}

function draw(): void {
  renderHud(hud, state);
  renderHotbar(hotbar, state);
  renderDungeonResult(dungeonResult, state);
}

canvas.addEventListener('click', (e) => {
  if (state.scene !== 'village') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const tileX = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
  const tileY = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

  if (tileX < 0 || tileY < 0 || tileX >= state.village.gridSize || tileY >= state.village.gridSize) return;
  if (!isTileFree(state.village, tileX, tileY)) return;

  const playerOnTile = circleRectOverlap(state.player.px, state.player.py, PLAYER_RADIUS, tileRect(tileX, tileY, TILE_SIZE));
  if (playerOnTile) return;

  state.pendingBuildTile = { x: tileX, y: tileY };
  notify();
});

hud.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const buildBtn = target.closest<HTMLElement>('[data-build-kind]');
  const craftToolBtn = target.closest<HTMLElement>('[data-craft-tool]');
  const craftArmorBtn = target.closest<HTMLElement>('[data-craft-armor]');
  const perkBtn = target.closest<HTMLElement>('[data-perk-kind]');

  if (perkBtn) {
    const kind = perkBtn.dataset.perkKind as PerkKind;
    choosePerk(state.progression, kind);
    notify();
    return;
  }

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

  if (craftToolBtn) {
    const tool = craftToolBtn.dataset.craftTool as ToolKind;
    craftTool(state, tool);
    notify();
    return;
  }

  if (craftArmorBtn) {
    const slot = craftArmorBtn.dataset.craftArmor as ArmorSlot;
    craftArmor(state, slot);
    notify();
  }
});

dungeonResult.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.id === 'return-to-village-btn') {
    exitDungeon(state);
    saveGame(state);
    notify();
  }
});

subscribe(draw);
draw();

startGameLoop(ctx);
