# Wanderhold

Juego 2D de gestión/mazmorra (aldea + dungeon runs), inspirado libremente en Loop Hero. MVP: vanilla TypeScript + Canvas + Vite, sin backend, save en localStorage.

## Estado actual (MVP)

- Aldea en grid 20x20, grid completo visible (sin cámara/scroll).
- HUD en dos columnas (`.hud-columns` en `style.css`, armado en `renderVillageHud` de `ui/hud.ts`): izquierda = progreso del personaje (Nivel/Perks + Herramientas/Armadura), derecha = todo lo de la aldea (Inventario, Objetivos, Población/edificios). El botón "Entrar a la mazmorra" y los Controles quedan a todo el ancho debajo, porque no son de ningún lado en particular. Las columnas usan flexbox con wrap, así se apilan solas en ventanas angostas sin necesidad de media queries.
- Movimiento libre en píxeles (no tile-a-tile): WASD combina ejes y normaliza diagonales, podés quedarte a mitad de dos tiles. Colisión círculo-vs-tile resuelta por eje (sub-pasos) contra nodos de recursos y edificios, con deslizamiento contra obstáculos.
- Nodos de recursos (árboles/rocas) con golpes limitados; mientras estés en contacto con uno, se resuelve un golpe cada ~450ms. El yield por golpe escala con el nivel de herramienta (1 + nivel), con bonus al agotar el nodo. Mientras el jugador está en contacto con un nodo (`isPlayerTouchingNode` en `engine/gather.ts`, reusado por el renderer) se muestra una mini barra de vida sobre el tile con `hits/maxHits` — solo mientras se está "minando", no todo el tiempo, para no saturar el mapa. Al romperse, aparece un texto flotante "+n `<recurso>`" que sube y se desvanece (`engine/floatingText.ts`) con el total ganado en ese golpe final (incluye el bonus de agotamiento). Al agotarse, el nodo deja de bloquear el paso y desaparece; a los 60s reaparece solo, en un tile libre distinto al original (nunca en el mismo lugar), además del respawn parcial al volver de la mazmorra.
- Edificios: clickeás un tile vacío del grid → panel lateral para elegir qué construir (spatial building, no menú abstracto). Taller (cuesta solo madera — a propósito, así se puede construir a mano antes de tener pico; si costara piedra sería un softlock) habilita crafteo Madera/Piedra. Herrería (cuesta solo piedra + hierro, sin madera) habilita crafteo Hierro y requiere Taller además. Choza suma un poblador (población = cantidad de Chozas); cada poblador junta +1 madera cada 10s de forma pasiva (ver más abajo). Depósito suma +40 a la capacidad de inventario por recurso (base 50), acumulable con más de uno. Los edificios bloquean el paso como obstáculo sólido.
- Costo escalable: Choza (x1.25 por unidad) y Depósito (x1.3 por unidad) cuestan más cada vez que construís uno nuevo — evita que se puedan spamear apenas hay recursos y estira la curva de progresión. Taller y Herrería tienen costo fijo (`growth: 1`) porque solo tiene sentido construir uno de cada. `getBuildingCost(state, kind)` calcula el costo real según cuántos ya tenés; el panel de construcción y `placeBuilding` siempre usan ese valor, nunca el costo base del def.
- Tercer recurso: vetas de Hierro en la aldea (más raras y duras que la piedra), bloqueadas hasta tener Pico de Piedra (nv. 2+).
- Craft (estilo Minecraft): los árboles se cortan a mano sin herramienta. Las rocas necesitan Pico de Madera, el hierro necesita Pico de Piedra (tocarlos sin la herramienta correcta no hace nada, se ve un candado sobre el tile). Con un Taller construido, en el panel lateral se craftea Hacha y Pico en progresión Mano → Madera → Piedra → Hierro (cada tier sube el yield de gathering); el salto a Hierro además requiere haber construido una Herrería. También hay 3 slots de armadura (Casco/Pechera/Botas) con la misma progresión de materiales, que suman Defensa y reducen el daño recibido en la mazmorra (con piso de 1 de daño). El tier actual de cada herramienta/pieza se ve en un hotbar debajo del canvas, separado del panel de crafteo que sigue al costado.
- Mazmorra: botón "Entrar a la mazmorra" desde la aldea. Escena separada con piso de piedra (sprites pixel art, misma técnica de variación que el pasto) y sprites pixel art de personaje/enemigos (vos con hacha, gelatina/bandido/lobo cada uno con su arte propio), combate 100% automático (sin control del personaje), resuelto por números con log visual en el panel lateral. 5 encuentros por run, ~50% winrate con stats base.
- Profundidad de mazmorra: `GameState.dungeonDepth` cuenta cuántas runs ganaste en total (nunca baja) y escala HP/ataque de los enemigos (+12%/+10% por nivel) y el botín (+15% por nivel) de cada run nueva. Cada run "snapshotea" la profundidad al entrar, así el escalado no cambia a mitad de un combate. Se muestra en el HUD de aldea y en el título del HUD de mazmorra.
- Jefes de profundidad: cada 5 runs (la 5ta, 10ma, 15ta...) el último enemigo de la cola es un jefe — mismo pool de `ENEMY_DEFS` pero con HP x2.5, ataque x1.6 y botín x3 sobre el escalado normal de esa profundidad (`dungeon/enemies.ts`, `isBossDepth`/`BOSS_*`). Se anuncia en el HUD de aldea antes de entrar y en el HUD de mazmorra durante la run; visualmente el jefe se dibuja más grande con un glow dorado y la barra de HP tiene borde dorado (`dungeon/renderer.ts`).
- Objetivos (quests): 3 objetivos activos siempre visibles en el HUD de aldea con barra de progreso (`state/quests.ts`). Se generan de un pool de 6 tipos (juntar cada recurso, ganar runs, derrotar enemigos, construir edificios) con meta y recompensa sorteadas dentro de un rango. El progreso se mide contra `GameState.stats` (contadores acumulados de por vida, nunca bajan — `lifetimeWood/Stone/Iron`, `dungeonWins`, `enemiesDefeated`, `buildingsBuilt`), así que sigue avanzando aunque el inventario esté al tope. Al completarse una quest se entrega la recompensa (respetando el cap) y se reemplaza al toque por una nueva, evitando repetir un tipo ya activo. Además aparece un toast arriba de todo ("¡Objetivo completado: X! +recursos") con el monto realmente acreditado (`ui/toasts.ts`) — el toast vive fuera de `GameState` (no se persiste) y se retira solo con su propio timer, sin depender de que el juego dispare un re-render mientras está visible.
- Muerte en mazmorra: conservás 50% del botín acumulado en esa run.
- Al terminar la run (victoria o derrota) aparece una pantalla de resultado sobre el canvas con el botín ganado (ya con el 50% de penalidad aplicado si fue derrota) y un botón "Volver a la aldea" — el regreso ya no es automático por tiempo, es una acción del jugador. Al volver se repuebla ~30% de los nodos de recursos agotados, y si la run terminó en victoria la profundidad global sube en 1.
- Población e ingreso pasivo: cada Choza suma un poblador (`state/population.ts`); cada 10s, cada poblador junta +1 madera sola, sin que el jugador tenga que estar cortando — el tick corre siempre (aldea o mazmorra), así la economía no se "pausa" al salir a combatir. Se ve en el HUD de aldea junto con la cuenta de población.
- Capacidad de inventario: cada recurso tiene un cap compartido (base 50, +40 por cada Depósito construido). Todo lo que suma inventario — gathering manual, ingreso pasivo, botín de mazmorra — pasa por el mismo helper (`addResourceCapped`), así el cap no se puede saltear por ningún camino. El HUD muestra `cantidad/cap` por recurso.
- Nivel y perks (`state/progression.ts`): el jugador gana XP derrotando enemigos (+8, +25 extra si es jefe) y ganando runs (+12). Al juntar suficiente XP sube de nivel y el HUD de aldea muestra un panel destacado (borde dorado) con 3 perks al azar para elegir uno — mientras hay una elección pendiente, el XP extra se seguía acumulando pero no dispara otro level-up hasta resolver esa elección (evita saltarse niveles sin elegir nada). Los 5 perks son acumulables (elegir el mismo varias veces suma el bonus de nuevo): Vigor (+4 HP máx.), Fuerza (+1 ataque), Resistencia (+1 defensa), Prospector (+10% botín de mazmorra) y Recolector (-10% tiempo entre golpes al recolectar, con piso de -50%). Los bonos de combate se aplican al entrar a la mazmorra (`dungeon/index.ts`) y el de botín al resolver cada loot (`dungeon/combat.ts`); el de Recolector se aplica directo en `engine/gather.ts`. Debajo del nivel hay un resumen siempre visible ("Perks") con cuántos puntos tenés en cada uno (`xN`) y el bono total acumulado (`formatPerkBonus`), no solo en el momento de elegir.
- Autoguardado en localStorage cada ~3s (save key `wanderhold-save-v6`, bumpeada por el nuevo campo requerido `DungeonRunState.depth` — saves de versiones anteriores se descartan solos).
- Arte pixel art generado con IA (Gemini) — ver `ART_PROMPTS.md` para los prompts. Las 3 fases están completas: Fase 1 (aldea) son sprites 32×32 (pasto en 2 variantes, árbol, roca, hierro, taller, herrería, choza, personaje), cargados por `src/engine/sprites.ts`. Fase 2 (mazmorra) son sprites recortados a su propio bounding box, no forzados a 32×32 (piso en 2 variantes, personaje de combate, 3 enemigos), cargados por `src/dungeon/sprites.ts` y anclados por el borde inferior para que todos "pisen" la misma línea de piso. Fase 3 (hotbar) son 5 íconos en tono metálico neutro (hacha, pico, casco, pechera, botas) — el tier Mano/Madera/Piedra/Hierro se resuelve recoloreando ese mismo ícono con un filtro CSS por clase (`tier-0..3` en `style.css`), no hay un ícono distinto por tier. Las dos variantes de piso/pasto usan otra técnica compartida: hash determinístico por tile para que la variante secundaria aparezca como acento disperso (~12-15%) en vez de alternar en damero, que se leía como un patrón mecánico.

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
  engine/        game loop (branch por escena), input (vector libre), colisión, movimiento, gathering, render de la aldea, carga de sprites
  state/         estado del juego, generación de la aldea, edificios, craft, save/load
  dungeon/       generación de enemigos, resolución de combate, render de la escena de mazmorra (piso + sprites), carga de sprites de mazmorra
  ui/            HUD (panel lateral), hotbar (tiers de herramientas/armadura), y overlay de resultado de mazmorra (botín + volver a la aldea)
  types/         tipos compartidos
  assets/sprites/ sprites pixel art PNG (aldea + mazmorra + íconos hotbar) usados por engine/sprites.ts, dungeon/sprites.ts y ui/hotbar.ts
```

## Git

El repo ya está versionado (remote `git@github.com:giannidona/wanderhold.git`) y algo en tu Cowork/Desktop auto-commitea los cambios de esta carpeta a medida que se van haciendo — no hace falta pedir el commit a mano, ya queda historial por feature. Vos hacés el `git push`/sync desde tu lado cuando quieras.

## Pendiente de definir

- Sprite direccional del jugador en la aldea: se espeja en X según la última tecla horizontal (A/D), pero sigue siendo la misma imagen "de frente" — no hay sprites reales de espalda/perfil ni animación de caminata.
- Tier de Diamante (y más allá) para herramientas/armadura: la tabla de tiers en `state/craft.ts` está armada para sumar filas nuevas sin tocar el resto de la lógica.
- Costo de armadura es uniforme entre los 3 slots hoy; diferenciar Pechera (más cara) es una mejora simple pendiente.
- Velocidad de movimiento (4.5 tiles/seg), radio de colisión y tiempo de regeneración de recursos (60s, sin aviso visual) son primeros números, a ajustar jugándolo.
- Balance de combate y de costos de crafteo/construcción más fino (primer pase, a ajustar con playtesting), incluido el ritmo de escalado por profundidad de mazmorra (+12%/+10%/+15%) y el ingreso pasivo por población (+1 madera/poblador/10s) — son primeros números.
- Nota de limpieza: el scaffold de Vite dejó archivos boilerplate sin usar (`src/counter.ts`, `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/typescript.svg`, `public/icons.svg`) — no se importan en ningún lado y no afectan el build. Se pueden borrar cuando quieras.
