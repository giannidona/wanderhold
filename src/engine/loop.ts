import { state, notify } from '../state/store';
import { getActiveDirection, initInput } from './input';
import { tryMove } from './movement';
import { render } from './renderer';
import { saveGame } from '../state/save';
import { renderDungeon } from '../dungeon/renderer';
import { tickCombat } from '../dungeon/combat';
import { exitDungeon } from '../dungeon';

const MOVE_COOLDOWN_MS = 140;
const AUTOSAVE_INTERVAL_MS = 3000;
const COMBAT_TICK_MS = 700;
const RETURN_DELAY_MS = 1500;

export function startGameLoop(ctx: CanvasRenderingContext2D): void {
  initInput();

  let lastMoveTime = 0;
  let lastSaveTime = 0;
  let lastCombatTime = 0;
  let outcomeAt = 0;

  function frame(time: number): void {
    if (state.scene === 'village') {
      const dir = getActiveDirection();
      if (dir && time - lastMoveTime > MOVE_COOLDOWN_MS) {
        const result = tryMove(state, dir);
        if (result !== 'blocked') notify();
        lastMoveTime = time;
      }

      if (time - lastSaveTime > AUTOSAVE_INTERVAL_MS) {
        saveGame(state);
        lastSaveTime = time;
      }

      render(ctx, state);
    } else if (state.scene === 'dungeon' && state.dungeon) {
      const run = state.dungeon;

      if (!run.outcome) {
        if (time - lastCombatTime > COMBAT_TICK_MS) {
          tickCombat(run);
          lastCombatTime = time;
          notify();
          if (run.outcome) outcomeAt = time;
        }
      } else if (outcomeAt && time - outcomeAt > RETURN_DELAY_MS) {
        exitDungeon(state);
        outcomeAt = 0;
        saveGame(state);
        notify();
      }

      renderDungeon(ctx, state);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
