# Wanderhold

Juego 2D de gestión/mazmorra (aldea + dungeon runs), inspirado libremente en Loop Hero. MVP: vanilla TypeScript + Canvas + Vite, sin backend, save en localStorage.

## Estado actual (MVP)

- Aldea en grid 20x20, grid completo visible (sin cámara/scroll).
- Movimiento libre en píxeles (no tile-a-tile): WASD combina ejes y normaliza diagonales, podés quedarte a mitad de dos tiles. Colisión círculo-vs-tile resuelta por eje (sub-pasos) contra nodos de recursos y edificios, con deslizamiento contra obstáculos.
- Nodos de recursos (árboles/rocas) con golpes limitados; mientras estés en contacto con uno, se resuelve un golpe cada ~450ms. El yield por golpe escala con el nivel de herramienta (1 + nivel), con bonus al agotar el nodo. Al agotarse, el nodo deja de bloquear el paso y desaparece sin indicador visual; a los 60s reaparece solo, en un tile libre distinto al original (nunca en el mismo lugar), además del respawn parcial al volver de la mazmorra.
- Edificios: clickeás un tile vacío del grid → panel lateral para elegir qué construir (spatial building, no menú abstracto). Taller (cuesta solo madera — a propósito, así se puede construir a mano antes de tener pico; si costara piedra sería un softlock) habilita crafteo Madera/Piedra. Herrería (cuesta solo piedra + hierro, sin madera) habilita crafteo Hierro y requiere Taller además. Choza es decorativa (placeholder de población futura). Los edificios bloquean el paso como obstáculo sólido.
- Tercer recurso: vetas de Hierro en la aldea (más raras y duras que la piedra), bloqueadas hasta tener Pico de Piedra (nv. 2+).
- Craft (estilo Minecraft): los árboles se cortan a mano sin herramienta. Las rocas necesitan Pico de Madera, el hierro necesita Pico de Piedra (tocarlos sin la herramienta correcta no hace nada, se ve un candado sobre el tile). Con un Taller construido, en el panel lateral se craftea Hacha y Pico en progresión Mano → Madera → Piedra → Hierro (cada tier sube el yield de gathering); el salto a Hierro además requiere haber construido una Herrería. También hay 3 slots de armadura (Casco/Pechera/Botas) con la misma progresión de materiales, que suman Defensa y reducen el daño recibido en la mazmorra (con piso de 1 de daño). El tier actual de cada herramienta/pieza se ve en un hotbar debajo del canvas, separado del panel de crafteo que sigue al costado.
- Mazmorra: botón "Entrar a la mazmorra" desde la aldea. Escena separada con piso de piedra y personajes con silueta propia (vos con arma, gelatina/bandido/lobo cada uno con su forma), combate 100% automático (sin control del personaje), resuelto por números con log visual en el panel lateral. 5 encuentros por run, ~50% winrate con stats base.
- Muerte en mazmorra: conservás 50% del botín acumulado en esa run.
- Al terminar la run (victoria o derrota) aparece una pantalla de resultado sobre el canvas con el botín ganado (ya con el 50% de penalidad aplicado si fue derrota) y un botón "Volver a la aldea" — el regreso ya no es automático por tiempo, es una acción del jugador. Al volver se repuebla ~30% de los nodos de recursos agotados.
- Autoguardado en localStorage cada ~3s (save key `wanderhold-save-v5`, bumpeada por el recurso Hierro y el edificio Herrería — saves de versiones anteriores se descartan solos).

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
  dungeon/       generación de enemigos, resolución de combate, render de la escena de mazmorra (piso + siluetas por enemigo)
  ui/            HUD (panel lateral), hotbar (tiers de herramientas/armadura), y overlay de resultado de mazmorra (botín + volver a la aldea)
  types/         tipos compartidos
```

## Git

El repo ya está versionado (remote `git@github.com:giannidona/wanderhold.git`) y algo en tu Cowork/Desktop auto-commitea los cambios de esta carpeta a medida que se van haciendo — no hace falta pedir el commit a mano, ya queda historial por feature. Vos hacés el `git push`/sync desde tu lado cuando quieras.

## Pendiente de definir

- Dirección de arte final (pixel vs flat/geométrico) — el render actual es placeholder geométrico en ambas escenas. Los íconos del hotbar son SVG lineales simples, mismo criterio.
- Tier de Diamante (y más allá) para herramientas/armadura: la tabla de tiers en `state/craft.ts` está armada para sumar filas nuevas sin tocar el resto de la lógica.
- Costo de armadura es uniforme entre los 3 slots hoy; diferenciar Pechera (más cara) es una mejora simple pendiente.
- Velocidad de movimiento (4.5 tiles/seg), radio de colisión y tiempo de regeneración de recursos (60s, sin aviso visual) son primeros números, a ajustar jugándolo.
- Balance de combate y de costos de crafteo/construcción más fino (primer pase, a ajustar con playtesting).
- Efecto real de la Choza (población, capacidad, etc. — hoy es decorativa).
- Nota de limpieza: el scaffold de Vite dejó archivos boilerplate sin usar (`src/counter.ts`, `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/typescript.svg`, `public/icons.svg`) — no se importan en ningún lado y no afectan el build. Se pueden borrar cuando quieras.
