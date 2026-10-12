import { nearestIndex } from '$lib/chart.js';

/**
 * Attaches pointer AND keyboard index-tracking to a chart's transparent capture
 * rect. Applied as `use:hoverIndex={{ ... }}`.
 *
 * The four interactive charts previously repeated the pointer maths inline and
 * offered no keyboard path at all, so the tooltip was unreachable without a
 * mouse. Centralizing it means the arrow-key traversal and the ARIA slider role
 * arrive everywhere at once rather than four times or not at all.
 *
 * params: { scale, count, label, valueText, onhover, onleave }
 */
export function hoverIndex(node, params) {
  let p = params;
  let focused = false;
  let index = -1;

  node.setAttribute('tabindex', '0');
  node.setAttribute('role', 'slider');
  node.setAttribute('aria-label', p.label ?? 'Chart values by position');

  function aria() {
    node.setAttribute('aria-valuemin', '0');
    node.setAttribute('aria-valuemax', String(p.count - 1));
    node.setAttribute('aria-valuenow', String(Math.max(0, index)));
    if (p.valueText) node.setAttribute('aria-valuetext', p.valueText(Math.max(0, index)));
  }

  // Keyboard has no pointer position, so anchor the tooltip to the rect itself.
  function anchor(i) {
    const box = node.getBoundingClientRect();
    const [r0, r1] = p.scale.range();
    return {
      x: box.left + ((p.scale(i) - r0) / (r1 - r0)) * box.width,
      y: box.top + box.height / 2
    };
  }

  function set(i, x, y) {
    index = i;
    aria();
    p.onhover?.(i, x, y);
  }

  function clear() {
    index = -1;
    p.onleave?.();
  }

  const onPointerMove = (ev) => set(nearestIndex(ev, p), ev.clientX, ev.clientY);
  const onPointerLeave = () => { if (!focused) clear(); };
  const onFocus = () => {
    focused = true;
    const i = index < 0 ? 0 : index;
    const { x, y } = anchor(i);
    set(i, x, y);
  };
  const onBlur = () => { focused = false; clear(); };

  function onKeyDown(ev) {
    const last = p.count - 1;
    const step = ev.shiftKey ? Math.max(1, Math.round(p.count / 10)) : 1;
    let next = index;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') next = Math.min(last, index + step);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') next = Math.max(0, index - step);
    else if (ev.key === 'Home') next = 0;
    else if (ev.key === 'End') next = last;
    else if (ev.key === 'Escape') { node.blur(); return; }
    else return;
    ev.preventDefault();
    const { x, y } = anchor(next);
    set(next, x, y);
  }

  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerleave', onPointerLeave);
  node.addEventListener('focus', onFocus);
  node.addEventListener('blur', onBlur);
  node.addEventListener('keydown', onKeyDown);
  aria();

  return {
    update(next) { p = next; aria(); },
    destroy() {
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('keydown', onKeyDown);
    }
  };
}
