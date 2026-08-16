export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function tileRect(tileX: number, tileY: number, tileSize: number): Rect {
  return { x: tileX * tileSize, y: tileY * tileSize, w: tileSize, h: tileSize };
}

export function circleRectOverlap(cx: number, cy: number, radius: number, rect: Rect): boolean {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}
