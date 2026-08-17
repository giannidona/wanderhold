# Wanderhold — guía de prompts para arte pixel art

Esta guía es para generar los assets visuales del juego con la herramienta de IA que tengas a mano (Midjourney, ChatGPT/DALL-E, Leonardo, etc.). Está pensada para que generes en lotes y me vayas pasando los archivos — yo me encargo de integrarlos al renderer.

## Antes de generar: 3 reglas técnicas

1. **Generá más grande de lo que se usa en el juego.** Ningún generador de IA hace píxel nativo de 32x32 — lo que hace es una imagen grande que *parece* pixel art (bloques grandes, pocos colores). Generá a 512x512 o 1024x1024 con estilo pixel art, y yo la reduzco después con interpolación "nearest neighbor" (sin blur) al tamaño real del juego. Si la reducís vos con Photoshop/Preview, asegurate de que el modo de reescalado sea "nearest neighbor" / "sin suavizado", nunca bicúbico — si no, se ve borroso.
2. **Pedí fondo aislado**, blanco liso o magenta (`#FF00FF`) para todo lo que no sea un tile de piso. Los tiles de piso (pasto, piedra de mazmorra) sí van a pantalla completa sin fondo separado, porque se repiten en mosaico. Para todo lo demás (árboles, edificios, personaje, enemigos, íconos) necesito poder recortar el fondo — un fondo liso hace eso trivial.
3. **Formato PNG**, no JPG (JPG no permite transparencia y suma artefactos de compresión que arruinan los bordes limpios del pixel art).

Prompt base que va al principio de **todos** los prompts de abajo (pegalo siempre):

```
pixel art, 16-bit SNES-era RPG game asset, medieval fantasy village theme,
limited color palette (~20-24 colors), warm earthy tones (mossy greens,
browns, muted stone gray, gold accent), flat cel-shaded coloring, no
gradients, no anti-aliasing, crisp 1px dark outline around the silhouette,
clean readable shape at small size
```

Y al final, según el caso, uno de estos dos cierres:

- Para objetos sueltos (árboles, edificios, personaje, enemigos, íconos): `isolated on a plain white background, no scene, no cast shadow`
- Para tiles de piso: `seamless tileable texture, fills the entire frame edge to edge, viewed from directly above`

---

## Fase 1 — Núcleo de la aldea (empezar por acá)

Con esto ya se puede ver el cambio de estilo completo en la aldea. Recomiendo generar este lote primero, ver cómo se integra, y recién después seguir con mazmorra e íconos.

| Archivo | Prompt (subject, pegar después del prompt base) | Tamaño final en el juego |
|---|---|---|
| `tile-grass-a.png` | a single grass ground tile, short grass texture with a few blade details | 32×32 |
| `tile-grass-b.png` | a single grass ground tile, slightly darker shade with a couple of small pebbles | 32×32 |
| `resource-tree.png` | a small deciduous tree, round leafy green canopy, brown trunk, standing alone, three-quarter top-down view | 32×32 |
| `resource-rock.png` | a small cluster of gray granite boulders, standing alone, three-quarter top-down view | 32×32 |
| `resource-iron.png` | a small cluster of gray granite boulders with visible rust-orange iron ore veins glinting on the surface, three-quarter top-down view | 32×32 |
| `building-workshop.png` | a small medieval carpenter's workshop hut, wood plank walls, wood-shingle roof, a workbench visible through an open front, three-quarter top-down view | 32×32 |
| `building-forge.png` | a small medieval blacksmith's forge, stone and timber walls, a chimney with glowing orange embers, an anvil visible through an open front, three-quarter top-down view | 32×32 |
| `building-hut.png` | a small medieval peasant cottage, timber-framed walls with white plaster, thatched roof, one round window, three-quarter top-down view | 32×32 |
| `player-village.png` | a small adventurer character, hooded traveler's cloak, simple medieval clothing, standing idle facing forward, three-quarter top-down view | 32×32 |

Nota sobre `tile-grass-a/b`: son las dos variantes que ya uso hoy para el patrón de damero del pasto — necesito que las dos combinen bien entre sí (mismo tono base, solo cambia un poco el matiz), no que sean texturas completamente distintas.

## Fase 1b — Reintento de edificios (taller y herrería)

Probé taller/herrería/personaje reducidos a 32×32 de verdad (mock renderizado, no a ojo). El personaje quedó perfecto. Los edificios no: eran dioramas isométricos muy detallados (letrero "CARPENTER"/"BLACKSMITH", tejas individuales, estantería) y a 32px se vuelven un blob marrón indistinguible uno del otro — se pierde todo el detalle que los diferencia. El árbol y la roca sí funcionaron porque son formas simples de un solo objeto, no una escena arquitectónica completa.

Prompts nuevos, pensados para leerse como ícono a 32px en vez de ilustración grande. Pegá uno por vez en un chat nuevo de Gemini (no los mandes juntos). Son autocontenidos, no hace falta pegar nada más antes.

**`building-workshop.png` (reintento):**
```
pixel art, 16-bit SNES-era RPG game asset, medieval fantasy village theme,
limited color palette (~16-20 colors), warm earthy tones (browns, warm wood
tan, muted stone gray), flat cel-shaded coloring, no gradients, no
anti-aliasing, crisp 1px dark outline around the silhouette.

Subject: a small carpenter's workshop hut, extremely simple and iconic —
just a square wood-plank hut with a peaked wood-shingle roof and a single
small dark doorway. No visible text, no signage, no readable words, no
interior detail, no workbench, no tools shown. Think "game map icon", not
architectural illustration — a child should recognize it as "a wooden hut"
instantly from across a room.

Framing: subject fills at least 90% of the frame, minimal empty margin,
centered, three-quarter top-down view, isolated on a plain white
background, no scene, no cast shadow, no ground/grass underneath it.
```

**`building-forge.png` (reintento):**
```
pixel art, 16-bit SNES-era RPG game asset, medieval fantasy village theme,
limited color palette (~16-20 colors), dark stone gray walls with ONE
strong glowing orange/red accent, flat cel-shaded coloring, no gradients,
no anti-aliasing, crisp 1px dark outline around the silhouette.

Subject: a small blacksmith's forge hut, extremely simple and iconic —
just a square dark stone hut with a short chimney on top glowing bright
orange with embers/smoke, that orange glow is the single most eye-catching
color in the whole image. No visible text, no signage, no readable words,
no interior detail, no anvil, no tools shown. Think "game map icon", not
architectural illustration — a child should recognize it as "a forge with
fire" instantly from across a room, distinct at a glance from a plain
wooden hut.

Framing: subject fills at least 90% of the frame, minimal empty margin,
centered, three-quarter top-down view, isolated on a plain white
background, no scene, no cast shadow, no ground/grass underneath it.
```

Con esto debería alcanzar para que a 32px se distingan: taller = marrón cálido sin brillo, herrería = gris piedra + acento naranja de la chimenea.

## Fase 2 — Mazmorra

La mazmorra es una escena de combate tipo JRPG clásico (vos a la izquierda, enemigo a la derecha), no top-down. Los sprites acá van de perfil/tres cuartos mirando hacia el centro de la pantalla, y pueden tener bastante más detalle porque se ven grandes en pantalla.

| Archivo | Prompt (subject) | Tamaño final |
|---|---|---|
| `dungeon-floor-a.png` | a dungeon stone floor tile, worn cobblestone with cracks | 32×32 |
| `dungeon-floor-b.png` | a dungeon stone floor tile, slightly darker cobblestone with moss in the cracks | 32×32 |
| `player-battle.png` | a medieval adventurer in a ready combat stance holding an axe, side view facing right, full body | ~96×96 |
| `enemy-slime.png` | a slime monster, translucent green gelatinous blob with a simple face, side view facing left, squashed round shape | ~64×64 |
| `enemy-bandit.png` | a bandit enemy, dark leather armor, hood covering the face, holding a dagger, side view facing left, combat stance | ~80×80 |
| `enemy-wolf.png` | a wolf monster, gray fur, bared fangs, low aggressive stance, side view facing left | ~80×80 |

## Fase 3 — Íconos del hotbar (herramientas y armadura)

Estilo ícono de inventario (como Minecraft), no un objeto "en el mundo". Con uno por tipo alcanza — el tier (Madera/Piedra/Hierro) lo resuelvo yo con un recoloreado por código, no hace falta que generes 3 versiones de cada uno a menos que quieras más fidelidad más adelante.

| Archivo | Prompt (subject) |
|---|---|
| `icon-axe.png` | a single wood-handled axe, inventory item icon, angled diagonally |
| `icon-pickaxe.png` | a single wood-handled pickaxe, inventory item icon, angled diagonally |
| `icon-helmet.png` | a simple medieval helmet, inventory item icon, front-facing |
| `icon-chest.png` | a simple medieval leather chestplate, inventory item icon, front-facing |
| `icon-boots.png` | a pair of simple medieval leather boots, inventory item icon |

---

## Notas por herramienta

- **Midjourney**: agregá `--style raw --no blur, soft edges, photorealism, gradient` al final del prompt para que no te suavice el pixel art.
- **ChatGPT/DALL-E**: no usa flags, pero conviene repetir explícitamente "no soft shading, no blur, sharp pixel edges" en texto porque tiende a suavizar.
- **Leonardo.ai**: buscá el preset/modelo "Pixel Art" en el selector de estilos, ayuda mucho a mantener consistencia entre generaciones.

## Cuando tengas los archivos

Mandámelos como vengan (subilos acá al chat, o si querés los dejás directamente en la carpeta del proyecto en `src/assets/sprites/` con esos nombres de archivo). Yo me encargo de: recortar/reescalar prolijo con nearest-neighbor, sacar el fondo si hace falta, y reemplazar las formas geométricas actuales del renderer por estas imágenes.
