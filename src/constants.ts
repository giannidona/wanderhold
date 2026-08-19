export const TILE_SIZE = 32;
export const PLAYER_RADIUS = 11;

// Tiempo hasta que un nodo de recurso agotado vuelve a estar disponible.
export const RESOURCE_REGEN_MS = 60_000;

// Tamaño de chunk para el mundo infinito (ver state/village.ts): cada chunk
// es de CHUNK_TILES x CHUNK_TILES tiles y se genera proceduralmente la
// primera vez que el jugador se acerca.
export const CHUNK_TILES = 16;
