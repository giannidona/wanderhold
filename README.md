# Wanderhold

Juego 2D de gestión/mazmorra (aldea + dungeon runs), inspirado libremente en Loop Hero. MVP: vanilla TypeScript + Canvas + Vite, sin backend, save en localStorage.

## Estado actual (MVP)

- Aldea en grid 20x20, grid completo visible (sin cámara/scroll).
- Movimiento libre en píxeles (no tile-a-tile): WASD combina ejes y normaliza diagonales, podés quedarte a mitad de dos tiles. Colisión círculo-vs-tile resuelta por eje (sub-pasos) contra nodos de recursos y edificios, con deslizamiento contra obstáculos.
- Nodos de recursos (árboles/rocas) con golpes limitados; mientras estés en contacto con uno, se resuelve un golpe cada ~450ms. El yield por golpe escala con el nivel de herramienta (1 + nivel), con bonus al agotar el nodo. Al agotarse, el nodo deja de bloquear el paso y desaparece sin indicador visual; a los 60s reaparece solo, en un tile libre distinto al original (nunca en el mismo lugar), además del respawn parcial al volver de la mazmorra.
- Edificios: clickeás un tile vacío del grid → panel lateral para elegir qué construir (spatial building, no menú abstracto). Taller (habilita crafteo) y Choza (decorativa, placeholder de población futura). Los edificios bloquean el paso como obstáculo sólido.
- Craft (estilo Minecraft): sin herramienta gathereás "a mano" (tier Mano). Con un Taller construido, en el panel lateral se craftea Hacha y Pico en progresión Mano → Madera → Piedra (cada tier sube el yield de gathering). También hay 3 slots de armadura (Casco/Pechera/Botas) con la misma progresión de materiales, que suman Defensa y reducen el daño recibido en la mazmorra (con piso de 1 de daño). El tier actual de cada herramienta/pieza se ve en un hotbar debajo del canvas, separado del panel de crafteo que sigue al costado.
- Mazmorra: botón "Entrar a la mazmorra" desde la aldea. Escena separada, combate 100% automático (sin control del personaje), resuelto por números con log visual. 3 tipos de enemigo (gelatina/bandido/lobo), 5 encuentros por run, ~50% winrate con stats base.
- Muerte en mazmorra: conservás 50% del botín acumulado en esa run.
- Al volver de la mazmorra (victoria o derrota), se repuebla ~30% de los nodos de recursos agotados.
- Autoguardado en localStorage cada ~3s (save key `wanderhold-save-v4`, bumpeada por `armor` en el jugador y `playerDefense` en la mazmorra — saves de versiones anteriores se descartan solos).

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
  constants.ts   TILE_SIZE, PLAYER_RADIUS (compartidos por engine y state)
  engine/        game loop (branch por escena), input (vector libre), colisión, movimiento, gathering, render de la aldea
  state/         estado del juego, generación de la aldea, edificios, craft, save/load
  dungeon/       generación de enemigos, resolución de combate, render de la escena de mazmorra
  ui/            HUD (panel lateral: inventario/craft/build panel en aldea, combat log en mazmorra) + hotbar (tiers de herramientas/armadura sobre el canvas)
  types/         tipos compartidos
```

## Pendiente de definir

- Dirección de arte final (pixel vs flat/geométrico) — el render actual es placeholder geométrico en ambas escenas. Los íconos del hotbar son SVG lineales simples, mismo criterio.
- Tier de Hierro (y más allá) para herramientas/armadura: la tabla de tiers en `state/craft.ts` está armada para sumar filas nuevas sin tocar el resto de la lógica.
- Costo de armadura es uniforme entre los 3 slots hoy; diferenciar Pechera (más cara) es una mejora simple pendiente.
- Velocidad de movimiento (4.5 tiles/seg), radio de colisión y tiempo de regeneración de recursos (60s, sin aviso visual) son primeros números, a ajustar jugándolo.
- Balance de combate y de costos de crafteo/construcción más fino (primer pase, a ajustar con playtesting).
- Efecto real de la Choza (población, capacidad, etc. — hoy es decorativa).
- Nota de limpieza: el scaffold de Vite dejó archivos boilerplate sin usar (`src/counter.ts`, `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/typescript.svg`, `public/icons.svg`) — no se importan en ningún lado y no afectan el build. Se pueden borrar cuando quieras.
