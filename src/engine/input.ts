import type { Direction, Vector2 } from '../types';

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

// Vector libre: combina las teclas activas y normaliza, así el movimiento
// diagonal no es más rápido y el jugador puede quedarse a mitad de dos tiles.
export function getMovementVector(): Vector2 {
  let x = 0;
  let y = 0;
  if (pressed.has('left')) x -= 1;
  if (pressed.has('right')) x += 1;
  if (pressed.has('up')) y -= 1;
  if (pressed.has('down')) y += 1;

  if (x === 0 && y === 0) return { x: 0, y: 0 };

  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}
