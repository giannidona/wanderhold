// Toasts efímeros (ej. "¡Objetivo completado!"). Se manejan aparte del
// ciclo notify()/render() del resto de la UI a propósito: usan su propio
// setTimeout para desaparecer, así no dependen de que el juego dispare un
// re-render mientras están visibles (si el jugador queda quieto sin tocar
// nada, el toast igual se retira solo).
const TOAST_VISIBLE_MS = 4000;
const TOAST_FADE_MS = 300;

let container: HTMLElement | null = null;

export function initToasts(el: HTMLElement): void {
  container = el;
}

export function showToast(text: string): void {
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  container.appendChild(el);

  // Reflow forzado antes de agregar la clase de transición, para que la
  // animación de entrada corra incluso si el toast se crea y anima en el
  // mismo frame que otro.
  requestAnimationFrame(() => el.classList.add('toast--visible'));

  setTimeout(() => {
    el.classList.remove('toast--visible');
    setTimeout(() => el.remove(), TOAST_FADE_MS);
  }, TOAST_VISIBLE_MS);
}

export function formatResourceGain(gain: { wood: number; stone: number; iron: number }): string {
  const parts: string[] = [];
  if (gain.wood > 0) parts.push(`+${gain.wood} madera`);
  if (gain.stone > 0) parts.push(`+${gain.stone} piedra`);
  if (gain.iron > 0) parts.push(`+${gain.iron} hierro`);
  return parts.join(', ');
}
