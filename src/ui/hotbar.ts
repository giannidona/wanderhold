import type { GameState } from '../types';
import {
  ARMOR_SLOTS,
  ARMOR_TIERS,
  TOOL_KINDS,
  TOOL_TIERS,
  getArmorLevel,
  getToolLevel,
} from '../state/craft';

const ICONS: Record<string, string> = {
  axe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 19 L15 10" stroke-linecap="round"/><path d="M13 6 Q20 3 20 10 Q15 12.5 11.5 9 Z"/></svg>',
  pickaxe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 12 L18 18" stroke-linecap="round"/><path d="M4 8 Q10 2 20 8 Q13.5 10.2 12 12 Q10.5 10.2 4 8 Z"/></svg>',
  head: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 15 A7 7 0 0 1 19 15" stroke-linecap="round"/><rect x="4" y="15" width="16" height="2.5" fill="currentColor" stroke="none" rx="1"/></svg>',
  chest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M8 4 L6 8 L6 20 H18 L18 8 L16 4 L12 6.5 Z"/></svg>',
  boots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M8 3 V13.5 H10 L14.5 18 H20 V16 L16 14 V3 Z"/></svg>',
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

function slotHtml(icon: string, name: string, tierLabel: string, level: number): string {
  return `
    <div class="hotbar-slot tier-${level}" title="${name}: ${tierLabel}">
      <span class="hotbar-icon">${icon}</span>
      <span class="hotbar-tier">${tierLabel}</span>
    </div>
  `;
}
