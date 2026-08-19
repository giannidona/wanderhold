import type { Building, ChunkData, ResourceKind, ResourceNode, TilePos, VillageState } from '../types';
import { CHUNK_TILES } from '../constants';

// Densidad de nodos por chunk (16x16 = 256 tiles), calibrada para quedar
// cerca de la densidad del grid fijo original (16 árboles / 400 tiles ≈
// 4% — acá 10/256 ≈ 3.9%), así el mundo infinito no se siente ni más
// vacío ni más saturado que la versión anterior.
const TREE_PER_CHUNK = 10;
const ROCK_PER_CHUNK = 6;
const IRON_PER_CHUNK = 5;
const TREE_HITS = 3;
const ROCK_HITS = 4;
const IRON_HITS = 5;

// Cuántos chunks alrededor del jugador mantenemos cargados. 2 de margen
// más allá del viewport visible (ver engine/renderer.ts) para que nunca
// se vea "pop-in" de chunks generándose en el borde de la pantalla.
export const LOAD_RADIUS_CHUNKS = 2;

// PRNG determinístico (mulberry32) — a diferencia de Math.random(), con la
// misma semilla siempre da la misma secuencia, necesario para que un chunk
// genere siempre el mismo contenido sin tener que guardarlo entero.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function random(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunkSeed(worldSeed: number, cx: number, cy: number): number {
  let n = (cx * 374761393 + cy * 668265263 + worldSeed * 2246822519) >>> 0;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return (n ^ (n >>> 16)) >>> 0;
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function tileToChunk(tile: number): number {
  return Math.floor(tile / CHUNK_TILES);
}

function generateChunk(worldSeed: number, cx: number, cy: number, avoid: TilePos | null): ChunkData {
  const rand = mulberry32(chunkSeed(worldSeed, cx, cy));
  const nodes: ResourceNode[] = [];
  const occupied = new Set<string>();

  function placeNodes(kind: ResourceKind, count: number, maxHits: number): void {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 30) {
      attempts++;
      const localX = Math.floor(rand() * CHUNK_TILES);
      const localY = Math.floor(rand() * CHUNK_TILES);
      const x = cx * CHUNK_TILES + localX;
      const y = cy * CHUNK_TILES + localY;
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;
      if (avoid && x === avoid.x && y === avoid.y) continue;
      occupied.add(key);
      nodes.push({ id: `${kind}-${x}-${y}`, kind, x, y, hitsRemaining: maxHits, maxHits, respawnAt: null });
      placed++;
    }
  }

  placeNodes('wood', TREE_PER_CHUNK, TREE_HITS);
  placeNodes('stone', ROCK_PER_CHUNK, ROCK_HITS);
  placeNodes('iron', IRON_PER_CHUNK, IRON_HITS);

  return { cx, cy, resourceNodes: nodes };
}

// Genera cualquier chunk faltante en un radio de LOAD_RADIUS_CHUNKS
// alrededor del tile del jugador. Se llama cada frame en el game loop; es
// barato porque generar un chunk ya cargado es un simple lookup en el
// Record (no se regenera nunca dos veces).
export function ensureChunksLoaded(
  village: VillageState,
  playerTileX: number,
  playerTileY: number,
  avoid: TilePos | null = null
): void {
  const pcx = tileToChunk(playerTileX);
  const pcy = tileToChunk(playerTileY);

  for (let dy = -LOAD_RADIUS_CHUNKS; dy <= LOAD_RADIUS_CHUNKS; dy++) {
    for (let dx = -LOAD_RADIUS_CHUNKS; dx <= LOAD_RADIUS_CHUNKS; dx++) {
      const cx = pcx + dx;
      const cy = pcy + dy;
      const key = chunkKey(cx, cy);
      if (!village.chunks[key]) {
        village.chunks[key] = generateChunk(village.seed, cx, cy, avoid);
      }
    }
  }
}

export function createInitialVillage(seed: number, avoid: TilePos): VillageState {
  const village: VillageState = { seed, chunks: {}, buildings: [] };
  ensureChunksLoaded(village, avoid.x, avoid.y, avoid);
  return village;
}

// Nodos de todos los chunks cargados cuyo rango de tiles se solapa con
// [minTileX..maxTileX] x [minTileY..maxTileY]. Usado tanto para render
// (rango = viewport visible) como para gameplay (rango chico alrededor
// del jugador).
export function getNodesInTileRange(
  village: VillageState,
  minTileX: number,
  maxTileX: number,
  minTileY: number,
  maxTileY: number
): ResourceNode[] {
  const minCx = tileToChunk(minTileX);
  const maxCx = tileToChunk(maxTileX);
  const minCy = tileToChunk(minTileY);
  const maxCy = tileToChunk(maxTileY);

  const nodes: ResourceNode[] = [];
  for (let cy = minCy; cy <= maxCy; cy++) {
    for (let cx = minCx; cx <= maxCx; cx++) {
      const chunk = village.chunks[chunkKey(cx, cy)];
      if (chunk) nodes.push(...chunk.resourceNodes);
    }
  }
  return nodes;
}

// Nodos cerca de un tile puntual (gathering, colisión de movimiento) — un
// margen de 1 tile alcanza sobrado ya que el radio de contacto/colisión es
// bastante menor a un tile completo.
export function getNodesNearTile(village: VillageState, tileX: number, tileY: number, marginTiles = 1): ResourceNode[] {
  return getNodesInTileRange(village, tileX - marginTiles, tileX + marginTiles, tileY - marginTiles, tileY + marginTiles);
}

// Todos los nodos de todos los chunks cargados hasta ahora — usado por el
// tick de regeneración (no importa qué tan lejos esté el jugador, un
// nodo agotado en un chunk ya visitado debe poder regenerar solo) y por el
// respawn parcial al volver de la mazmorra.
export function getAllLoadedNodes(village: VillageState): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (const chunk of Object.values(village.chunks)) {
    nodes.push(...chunk.resourceNodes);
  }
  return nodes;
}

export function findNodeAt(village: VillageState, x: number, y: number): ResourceNode | undefined {
  const chunk = village.chunks[chunkKey(tileToChunk(x), tileToChunk(y))];
  if (!chunk) return undefined;
  return chunk.resourceNodes.find((n) => n.x === x && n.y === y && n.hitsRemaining > 0);
}

export function findBuildingAt(village: VillageState, x: number, y: number): Building | undefined {
  return village.buildings.find((b) => b.x === x && b.y === y);
}

// Libre de nodo/edificio. La ocupación del jugador (que se mueve libre, no
// por tile) se chequea aparte con colisión círculo-rect en el caller.
export function isTileFree(village: VillageState, x: number, y: number): boolean {
  if (findNodeAt(village, x, y)) return false;
  if (findBuildingAt(village, x, y)) return false;
  return true;
}
