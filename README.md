# Wanderhold

Juego 2D de gestión/mazmorra (aldea + dungeon runs), inspirado libremente en Loop Hero. MVP: vanilla TypeScript + Canvas + Vite, sin backend, save en localStorage.

## Estado actual (MVP)

- Aldea en grid 20x20, grid completo visible (sin cámara/scroll).
- Movimiento WASD tile a tile.
- Nodos de recursos (árboles/rocas) con golpes limitados; al chocar contra uno, recolectás en vez de moverte. El yield por golpe escala con el nivel de herramienta (1 + nivel), con bonus al agotar el nodo.
- Edificios: clickeás un tile vacío del grid → panel lateral para elegir qué construir (spatial building, no menú abstracto). Taller (habilita crafteo) y Choza (decorativa, placeholder de población futura). Los edificios bloquean el tile como obstáculo.
- Craft: con un Taller construido, panel de crafteo de Hacha/Pico en el HUD. 3 niveles cada uno, costo creciente por nivel, mejora el yield de gathering.
- Mazmorra: botón "Entrar a la mazmorra" desde la aldea. Escena separada, combate 100% automático (sin control del personaje), resuelto por números con log visual. 3 tipos de enemigo (gelatina/bandido/lobo), 5 encuentros por run, ~50% winrate con stats base.
- Muerte en mazmorra: conservás 50% del botín acumulado en esa run.
- Al volver de la mazmorra (victoria o derrota), se repuebla ~30% de los nodos de recursos agotados.
- Autoguardado en localStorage cada ~3s.

## Correr en local

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

## Build de producción

```bash
npm run build
npm run preview
```

## Deploy

Pensado para Vercel: framework preset "Vite", sin variables de entorno ni backend necesario para este MVP.

## Estructura

```
src/
  engine/    game loop (branch por escena), input WASD, movimiento/colisión, render de canvas de la aldea
  state/     estado del juego, generación de la aldea, edificios, craft, save/load
  dungeon/   generación de enemigos, resolución de combate, render de la escena de mazmorra
  ui/        HUD (panel lateral: inventario/craft/build panel en aldea, combat log en mazmorra)
  types/     tipos compartidos
```

## Pendiente de definir

- Dirección de arte final (pixel vs flat/geométrico) — el render actual es placeholder geométrico en ambas escenas.
- Balance de combate y de costos de crafteo/construcción más fino (primer pase, a ajustar con playtesting).
- Efecto real de la Choza (población, capacidad, etc. — hoy es decorativa).
- Nota de limpieza: el scaffold de Vite dejó archivos boilerplate sin usar (`src/counter.ts`, `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/typescript.svg`, `public/icons.svg`) — no se importan en ningún lado y no afectan el build. Se pueden borrar cuando quieras.
# wanderhold
