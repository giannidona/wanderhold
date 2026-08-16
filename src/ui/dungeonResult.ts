import type { GameState } from '../types';
import { DEFEAT_LOOT_RETENTION } from '../dungeon';

export function renderDungeonResult(container: HTMLElement, state: GameState): void {
  const run = state.dungeon;

  if (state.scene !== 'dungeon' || !run || !run.outcome) {
    container.innerHTML = '';
    container.classList.remove('is-visible');
    return;
  }

  const isVictory = run.outcome === 'victory';
  const retention = isVictory ? 1 : DEFEAT_LOOT_RETENTION;
  const wood = Math.floor(run.lootWood * retention);
  const stone = Math.floor(run.lootStone * retention);

  container.classList.add('is-visible');
  container.innerHTML = `
    <div class="dungeon-result-card">
      <h2 class="result-title ${isVictory ? 'result-title--win' : 'result-title--lose'}">
        ${isVictory ? '¡Mazmorra despejada!' : 'Caíste en combate'}
      </h2>
      <p class="result-subtitle">
        ${isVictory ? 'Botín recuperado' : `Conservaste el ${Math.round(DEFEAT_LOOT_RETENTION * 100)}% del botín de la run`}
      </p>
      <div class="result-loot">
        <div class="result-loot-item"><span class="result-loot-label">Madera</span><strong>+${wood}</strong></div>
        <div class="result-loot-item"><span class="result-loot-label">Piedra</span><strong>+${stone}</strong></div>
      </div>
      <button id="return-to-village-btn" type="button" class="primary-btn">Volver a la aldea</button>
    </div>
  `;
}
