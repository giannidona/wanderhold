import { state, notify } from '../state/store';
import { getMovementVector, initInput } from './input';
import { updatePlayerMovement } from './movement';
import { tickGathering } from './gather';
import { tickResourceRegen } from './regen';
import { render } from './renderer';
import { saveGame } from '../state/save';
import { renderDungeon } from '../dungeon/renderer';
import { tickCombat } from '../dungeon/combat';
import { tickPassiveIncome } from '../state/population';
import { tickQuests } from '../state/quests';
import { showToast, formatResourceGain } from '../ui/toasts';
import { ensureChunksLoaded } from '../state/village';
import { TILE_SIZE } from '../constants';

const AUTOSAVE_INTERVAL_MS = 3000;
const COMBAT_TICK_MS = 700;
const MAX_DT_SECONDS = 0.05;

export function startGameLoop(ctx: CanvasRenderingContext2D): void {
  initInput();

  let lastTime = 0;
  let lastSaveTime = 0;
  let lastCombatTime = 0;

  function frame(time: number): void {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, MAX_DT_SECONDS) : 0;
    lastTime = time;

    // Ingreso pasivo por población: corre siempre, incluso en la
    // mazmorra, para que la aldea no se sienta "pausada" al salir a
    // combatir.
    if (tickPassiveIncome(state, time)) {
      notify();
    }

    // Objetivos: se revisan siempre, no solo en la aldea, para que una
    // quest de "derrotá N enemigos" se complete apenas se cumple, incluso
    // a mitad de un combate.
    const completedQuests = tickQuests(state);
    if (completedQuests.length > 0) {
      for (const completion of completedQuests) {
        const gainText = formatResourceGain(completion.gained);
        showToast(`¡Objetivo completado: ${completion.label}!${gainText ? ` ${gainText}` : ''}`);
      }
      notify();
    }

    if (state.scene === 'village') {
      const moveVec = getMovementVector();
      updatePlayerMovement(state, moveVec, dt);

      // Genera los chunks que falten alrededor del jugador a medida que
      // camina — barato (son lookups en un Record) salvo la primera vez
      // que se pisa un chunk nuevo.
      ensureChunksLoaded(
        state.village,
        Math.floor(state.player.px / TILE_SIZE),
        Math.floor(state.player.py / TILE_SIZE)
      );

      const woodBefore = state.inventory.wood;
      const stoneBefore = state.inventory.stone;
      tickGathering(state, time);
      if (state.inventory.wood !== woodBefore || state.inventory.stone !== stoneBefore) {
        notify();
      }

      tickResourceRegen(state, time);

      if (time - lastSaveTime > AUTOSAVE_INTERVAL_MS) {
        saveGame(state);
        lastSaveTime = time;
      }

      render(ctx, state);
    } else if (state.scene === 'dungeon' && state.dungeon) {
      const run = state.dungeon;

      if (!run.outcome && time - lastCombatTime > COMBAT_TICK_MS) {
        tickCombat(run, state.stats, state.progression);
        lastCombatTime = time;
        notify();
      }

      renderDungeon(ctx, state);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
