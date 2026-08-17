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

    if (state.scene === 'village') {
      const moveVec = getMovementVector();
      updatePlayerMovement(state, moveVec, dt);

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
        tickCombat(run);
        lastCombatTime = time;
        notify();
      }

      renderDungeon(ctx, state);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
