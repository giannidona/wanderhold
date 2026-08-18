import type { GameState } from '../types';
import { BUILDING_DEFS, canAfford, getBuildingCost, getInventoryCap, hasForge, hasWorkshop, type BuildingCost } from '../state/buildings';
import { getPopulation, WOOD_PER_POPULATION } from '../state/population';
import { isBossDepth } from '../dungeon/enemies';
import { getQuestProgress } from '../state/quests';
import { formatPerkBonus, PERK_DEFS } from '../state/progression';
import {
  ARMOR_SLOTS,
  ARMOR_TIERS,
  TOOL_KINDS,
  TOOL_TIERS,
  canCraftArmor,
  canCraftTool,
  getArmorLevel,
  getToolLevel,
  missingBuildingFor,
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

function formatCost(cost: BuildingCost): string {
  const parts: string[] = [];
  if (cost.wood > 0) parts.push(`${cost.wood} madera`);
  if (cost.stone > 0) parts.push(`${cost.stone} piedra`);
  if (cost.iron > 0) parts.push(`${cost.iron} hierro`);
  return parts.join(' / ') || 'Gratis';
}

function renderVillageHud(state: GameState): string {
  const cap = getInventoryCap(state);
  const population = getPopulation(state);

  // Dos columnas: izquierda = progreso del personaje (nivel/perks +
  // herramientas/armadura), derecha = todo lo relacionado a la aldea
  // (inventario, objetivos, edificios/población). El botón de mazmorra y
  // los controles quedan abajo, a todo el ancho, porque no son de ningún
  // lado en particular.
  return `
    <div class="hud-columns">
      <div class="hud-col hud-col--left">
        ${renderProgressionSection(state)}
        ${renderCraftSection(state)}
      </div>
      <div class="hud-col hud-col--right">
        <div class="hud-section">
          <h2>Inventario</h2>
          <div class="hud-row"><span>Madera</span><strong>${state.inventory.wood}/${cap}</strong></div>
          <div class="hud-row"><span>Piedra</span><strong>${state.inventory.stone}/${cap}</strong></div>
          <div class="hud-row"><span>Hierro</span><strong>${state.inventory.iron}/${cap}</strong></div>
        </div>
        ${renderQuestsSection(state)}
        <div class="hud-section">
          <h2>Aldea</h2>
          <div class="hud-row"><span>Población</span><strong>${population}</strong></div>
          <p class="hud-hint">${
            population > 0
              ? `Tus ${population} pobladores juntan +${population * WOOD_PER_POPULATION} madera cada 10s de forma pasiva (incluso en la mazmorra).`
              : 'Construí una Choza para conseguir tu primer poblador y empezar a juntar madera de forma pasiva.'
          }</p>
          <div class="hud-row"><span>Profundidad de mazmorra</span><strong>${state.dungeonDepth}</strong></div>
          ${isBossDepth(state.dungeonDepth) ? '<p class="hud-hint hud-hint--boss">La próxima run termina con un jefe.</p>' : ''}
        </div>
      </div>
    </div>
    <div class="hud-section">
      <button id="enter-dungeon-btn" type="button" class="primary-btn">Entrar a la mazmorra</button>
    </div>
    <div class="hud-section">
      <h2>Controles</h2>
      <p class="hud-hint">WASD para moverte. Quedate en contacto con un árbol/roca/vena de hierro para recolectar (rocas necesitan Pico de Madera, hierro necesita Pico de Piedra). Clickeá un tile vacío del grid para construir. Guardado automático en localStorage.</p>
    </div>
  `;
}

function renderProgressionSection(state: GameState): string {
  return `${renderLevelSection(state)}${renderPerkSummarySection(state)}`;
}

function renderLevelSection(state: GameState): string {
  const prog = state.progression;

  if (prog.pendingChoice) {
    const options = prog.pendingChoice
      .map((kind) => {
        const def = PERK_DEFS.find((d) => d.kind === kind);
        if (!def) return '';
        return `
          <button class="perk-option" data-perk-kind="${kind}" type="button">
            <span class="perk-option-label">${def.label}</span>
            <span class="perk-option-desc">${def.description}</span>
          </button>
        `;
      })
      .join('');

    return `
      <div class="hud-section hud-section--perk">
        <h2>¡Subiste a nivel ${prog.level}! Elegí una mejora</h2>
        <div class="perk-options">${options}</div>
      </div>
    `;
  }

  const pct = Math.min(100, Math.round((prog.xp / prog.xpToNext) * 100));
  return `
    <div class="hud-section">
      <h2>Nivel ${prog.level}</h2>
      <div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
      <p class="hud-hint">${prog.xp}/${prog.xpToNext} XP — se gana derrotando enemigos y ganando runs de mazmorra.</p>
    </div>
  `;
}

// Resumen siempre visible de cuántos puntos tenés en cada perk y el bono
// total que te da — independiente de si hay una elección de nivel
// pendiente o no, así siempre podés ver dónde estás parado.
function renderPerkSummarySection(state: GameState): string {
  const prog = state.progression;

  const rows = PERK_DEFS.map((def) => {
    const count = prog.perkCounts[def.kind];
    const bonusText = count > 0 ? formatPerkBonus(def.kind, prog) : 'Sin puntos todavía';
    return `
      <div class="perk-summary-row${count === 0 ? ' perk-summary-row--empty' : ''}">
        <span class="perk-summary-label">${def.label}</span>
        <span class="perk-summary-count">x${count}</span>
        <span class="perk-summary-bonus">${bonusText}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="hud-section">
      <h2>Perks</h2>
      <div class="perk-summary">${rows}</div>
    </div>
  `;
}

function renderQuestsSection(state: GameState): string {
  const rows = state.quests
    .map((quest) => {
      const progress = getQuestProgress(state.stats, quest);
      const pct = Math.min(100, Math.round((progress / quest.targetAmount) * 100));
      return `
        <div class="quest-row">
          <div class="quest-row-top"><span>${quest.label}</span><span>${progress}/${quest.targetAmount}</span></div>
          <div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="hud-section">
      <h2>Objetivos</h2>
      ${rows}
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

  const toolRows = TOOL_KINDS.map(({ kind, label }) => {
    const level = getToolLevel(state, kind);
    const next = TOOL_TIERS[level + 1];
    const reason = missingBuildingFor(next, state);
    return craftRow(label, TOOL_TIERS, level, canCraftTool(state, kind), `data-craft-tool="${kind}"`, reason);
  }).join('');

  const armorRows = ARMOR_SLOTS.map(({ slot, label }) => {
    const level = getArmorLevel(state, slot);
    const next = ARMOR_TIERS[level + 1];
    const reason = missingBuildingFor(next, state);
    return craftRow(label, ARMOR_TIERS, level, canCraftArmor(state, slot), `data-craft-armor="${slot}"`, reason);
  }).join('');

  return `
    <div class="hud-section">
      <h2>Herramientas</h2>
      <div class="craft-options">${toolRows}</div>
    </div>
    <div class="hud-section">
      <h2>Armadura</h2>
      <div class="craft-options">${armorRows}</div>
    </div>
    ${hasForge(state) ? '' : '<div class="hud-section"><p class="hud-hint">Construí una Herrería para poder craftear el tier Hierro.</p></div>'}
  `;
}

function craftRow(
  label: string,
  tiers: ToolTierDef[] | ArmorTierDef[],
  level: number,
  affordable: boolean,
  dataAttr: string,
  lockedReason: string | null
): string {
  const current = tiers[level];
  const next = tiers[level + 1];
  const maxed = !next;

  let costLabel: string;
  if (maxed) {
    costLabel = 'Nivel máximo';
  } else if (lockedReason) {
    costLabel = lockedReason;
  } else if (next.cost) {
    costLabel = `Mejorar a ${next.label}: ${formatCost(next.cost)}`;
  } else {
    costLabel = '';
  }

  return `
    <button
      class="craft-option${affordable ? '' : ' craft-option--disabled'}"
      ${dataAttr}
      ${affordable ? '' : 'disabled'}
    >
      <span class="craft-option-label">${label} · ${current.label}</span>
      <span class="craft-option-cost">${costLabel}</span>
    </button>
  `;
}

function renderBuildPanel(state: GameState): string {
  const tile = state.pendingBuildTile;
  if (!tile) return renderVillageHud(state);

  const rows = BUILDING_DEFS.map((def) => {
    const cost = getBuildingCost(state, def.kind);
    const affordable = canAfford(state, cost);
    return `
      <button
        class="build-option${affordable ? '' : ' build-option--disabled'}"
        data-build-kind="${def.kind}"
        ${affordable ? '' : 'disabled'}
      >
        <span class="build-option-label">${def.label}</span>
        <span class="build-option-cost">${formatCost(cost)}</span>
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
        : enemy?.isBoss
          ? `<p class="hud-hint hud-hint--boss">Enemigo ${progress}: ${enemy.label} — ¡jefe de profundidad!</p>`
          : `<p class="hud-hint">Enemigo ${progress}${enemy ? `: ${enemy.label}` : ''}</p>`;

  const bossWarning =
    !run.outcome && !enemy?.isBoss && run.enemies[run.enemies.length - 1]?.isBoss
      ? '<p class="hud-hint hud-hint--boss">Esta run termina con un jefe. Preparate.</p>'
      : '';

  const logHtml = run.log
    .slice(-10)
    .reverse()
    .map((entry) => `<div class="log-row">${entry.text}</div>`)
    .join('');

  return `
    <div class="hud-section">
      <h2>Mazmorra · Profundidad ${run.depth}</h2>
      ${statusLine}
      ${bossWarning}
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
