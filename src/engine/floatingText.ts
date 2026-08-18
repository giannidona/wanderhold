// Textos flotantes efímeros dibujados sobre el canvas (ej. "+3 madera" al
// romper un nodo de recurso). Viven en un array a nivel de módulo, no en
// GameState, porque son puramente cosméticos y no deben persistirse en el
// save ni afectar la lógica del juego.
export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  createdAt: number;
  color: string;
}

const FLOAT_DURATION_MS = 900;
const FLOAT_RISE_PX = 22;

let idCounter = 0;
const active: FloatingText[] = [];

export function spawnFloatingText(x: number, y: number, text: string, color = '#eae6da'): void {
  idCounter += 1;
  active.push({ id: idCounter, text, x, y, createdAt: performance.now(), color });
}

// Dibuja y poda en el mismo paso: cada texto sube y se desvanece durante
// FLOAT_DURATION_MS, y se elimina del array apenas expira.
export function drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
  if (active.length === 0) return;
  const now = performance.now();

  for (let i = active.length - 1; i >= 0; i--) {
    const f = active[i];
    const age = now - f.createdAt;
    if (age > FLOAT_DURATION_MS) {
      active.splice(i, 1);
      continue;
    }

    const t = age / FLOAT_DURATION_MS;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - FLOAT_RISE_PX * t);
    ctx.restore();
  }
}
