import type { GameState } from '../types';
import {
  ARMOR_SLOTS,
  ARMOR_TIERS,
  TOOL_KINDS,
  TOOL_TIERS,
  getArmorLevel,
  getToolLevel,
} from '../state/craft';
import iconAxe from '../assets/sprites/icon-axe.png';
import iconPickaxe from '../assets/sprites/icon-pickaxe.png';
import iconHelmet from '../assets/sprites/icon-helmet.png';
import iconChest from '../assets/sprites/icon-chest.png';
import iconBoots from '../assets/sprites/icon-boots.png';

// Un solo ícono pixel art por tipo (tono metálico neutro) — el tier
// (Madera/Piedra/Hierro) se resuelve con un filtro CSS por clase `tier-N`
// en style.css, no hace falta un ícono distinto por tier.
const ICONS: Record<string, string> = {
  axe: iconAxe,
  pickaxe: iconPickaxe,
  head: iconHelmet,
  chest: iconChest,
  boots: iconBoots,
};

export function renderHotbar(container: HTMLElement, state: GameState): void {
  if (state.scene !== 'village') {
    container.innerHTML = '';
    return;
  }

  const toolSlots = TOOL_KINDS.map(({ kind, label }) => {
    const level = getToolLevel(state, kind);
    return slotHtml(ICONS[kind], label, TOOL_TIERS[level].label, level);
  }).join('');

  const armorSlots = ARMOR_SLOTS.map(({ slot, label }) => {
    const level = getArmorLevel(state, slot);
    return slotHtml(ICONS[slot], label, ARMOR_TIERS[level].label, level);
  }).join('');

  container.innerHTML = `
    <div class="hotbar-group">${toolSlots}</div>
    <div class="hotbar-divider"></div>
    <div class="hotbar-group">${armorSlots}</div>
  `;
}

function slotHtml(iconSrc: string | undefined, name: string, tierLabel: string, level: number): string {
  return `
    <div class="hotbar-slot tier-${level}" title="${name}: ${tierLabel}">
      <span class="hotbar-icon"><img src="${iconSrc ?? ''}" alt="${name}" /></span>
      <span class="hotbar-tier">${tierLabel}</span>
    </div>
  `;
}
