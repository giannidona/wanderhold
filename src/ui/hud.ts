import type { GameState } from '../types';
import { BUILDING_DEFS, canAfford, hasWorkshop } from '../state/buildings';
import {
  ARMOR_SLOTS,
  ARMOR_TIERS,
  TOOL_KINDS,
  TOOL_TIERS,
  canCraftArmor,
  canCraftTool,
  getArmorLevel,
  getToolLevel,
  type ArmorTierDef,
  type ToolTierDef,
} from '../state/craft';

export function renderHud(container: HTMLElement, state: GameState): void {
  if (state.scene === 'dungeon') {
    container.innerHTML = renderDungeonHud(state);
    return;
  }

  container.innerHTML = state.pendingBuildTile
    ? renderBuildPanel(state)
    : renderVillageHud(state);
}

function renderVillageHud(state: GameState): string {
  return `
    <div class="hud-section">
      <h2>Inventario</h2>
      <div class="hud-row"><span>Madera</span><strong>${state.inventory.wood}</strong></div>
      <div class="hud-row"><span>Piedra</span><strong>${state.inventory.stone}</strong></div>
    </div>
    ${renderCraftSection(state)}
    <div class="hud-section">
      <button id="enter-dungeon-btn" type="button" class="primary-btn">Entrar a la mazmorra</button>
    </div>
    <div class="hud-section">
      <h2>Controles</h2>
      <p class="hud-hint">WASD para moverte. Quedate en contacto con un árbol o roca para recolectar.${state.player.tools.pickaxeLevel <= 0 ? ' Las rocas están bloqueadas hasta que craftees un Pico de Madera.' : ''} Clickeá un tile vacío del grid para construir. Guardado automático en localStorage.</p>
    </div>
  `;
}

function renderCraftSection(state: GameState): string {
  if (!hasWorkshop(state)) {
    return `
      <div class="hud-section">
        <h2>Craftear</h2>
        <p class="hud-hint">Construí un Taller para desbloquear el crafteo de herramientas y armadura.</p>
      </div>
    `;
  }

  const toolRows = TOOL_KINDS.map(({ kind, label }) =>
    craftRow(label, TOOL_TIERS, getToolLevel(state, kind), canCraftTool(state, kind), `data-craft-tool="${kind}"`)
  ).join('');

  const armorRows = ARMOR_SLOTS.map(({ slot, label }) =>
    craftRow(label, ARMOR_TIERS, getArmorLevel(state, slot), canCraftArmor(state, slot), `data-craft-armor="${slot}"`)
  ).join('');

  return `
    <div class="hud-section">
      <h2>Herramientas</h2>
      <div class="craft-options">${toolRows}</div>
    </div>
    <div class="hud-section">
      <h2>Armadura</h2>
      <div class="craft-options">${armorRows}</div>
    </div>
  `;
}

function craftRow(
  label: string,
  tiers: ToolTierDef[] | ArmorTierDef[],
  level: number,
  affordable: boolean,
  dataAttr: string
): string {
  const current = tiers[level];
  const next = tiers[level + 1];
  const maxed = !next;
  const costLabel = maxed || !next.cost ? 'Nivel máximo' : `${next.cost.wood} madera / ${next.cost.stone} piedra`;

  return `
    <button
      class="craft-option${affordable ? '' : ' craft-option--disabled'}"
      ${dataAttr}
      ${affordable ? '' : 'disabled'}
    >
      <span class="craft-option-label">${label} · ${current.label}</span>
      <span class="craft-option-cost">${maxed ? costLabel : `Mejorar a ${next.label}: ${costLabel}`}</span>
    </button>
  `;
}

function renderBuildPanel(state: GameState): string {
  const tile = state.pendingBuildTile;
  if (!tile) return renderVillageHud(state);

  const rows = BUILDING_DEFS.map((def) => {
    const affordable = canAfford(state, def.cost);
    return `
      <button
        class="build-option${affordable ? '' : ' build-option--disabled'}"
        data-build-kind="${def.kind}"
        ${affordable ? '' : 'disabled'}
      >
        <span class="build-option-label">${def.label}</span>
        <span class="build-option-cost">${def.cost.wood} madera / ${def.cost.stone} piedra</span>
        <span class="build-option-desc">${def.description}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="hud-section">
      <h2>Construir en (${tile.x}, ${tile.y})</h2>
      <div class="build-options">${rows}</div>
      <button id="cancel-build-btn" type="button" class="secondary-btn">Cancelar</button>
    </div>
  `;
}

function renderDungeonHud(state: GameState): string {
  const run = state.dungeon;
  if (!run) return '';

  const enemy = run.enemies[run.currentEnemyIndex];
  const progress = `${Math.min(run.currentEnemyIndex + 1, run.enemies.length)}/${run.enemies.length}`;

  const statusLine =
    run.outcome === 'victory'
      ? '<p class="hud-outcome hud-outcome--win">Mazmorra despejada</p>'
      : run.outcome === 'defeat'
        ? '<p class="hud-outcome hud-outcome--lose">Caíste en combate</p>'
        : `<p class="hud-hint">Enemigo ${progress}${enemy ? `: ${enemy.label}` : ''}</p>`;

  const logHtml = run.log
    .slice(-10)
    .reverse()
    .map((entry) => `<div class="log-row">${entry.text}</div>`)
    .join('');

  return `
    <div class="hud-section">
      <h2>Mazmorra</h2>
      ${statusLine}
      <div class="hud-row"><span>Tu HP</span><strong>${Math.max(run.playerHp, 0)}/${run.playerMaxHp}</strong></div>
      <div class="hud-row"><span>Defensa</span><strong>${run.playerDefense}</strong></div>
      <div class="hud-row"><span>Botín (run)</span><strong>${run.lootWood} madera / ${run.lootStone} piedra</strong></div>
    </div>
    <div class="hud-section">
      <h2>Registro de combate</h2>
      <div class="combat-log">${logHtml}</div>
    </div>
  `;
}
