import type { Direction } from '../types';

const KEY_MAP: Record<string, Direction> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

const pressed = new Set<Direction>();
const PRIORITY: Direction[] = ['up', 'down', 'left', 'right'];

export function initInput(): void {
  window.addEventListener('keydown', (e) => {
    const dir = KEY_MAP[e.code];
    if (dir) {
      pressed.add(dir);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEY_MAP[e.code];
    if (dir) pressed.delete(dir);
  });
  window.addEventListener('blur', () => pressed.clear());
}

export function getActiveDirection(): Direction | null {
  for (const dir of PRIORITY) {
    if (pressed.has(dir)) return dir;
  }
  return null;
}
