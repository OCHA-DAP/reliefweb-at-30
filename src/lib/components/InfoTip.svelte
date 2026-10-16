<script>
  // A small "i" button whose definition shows on hover, on keyboard focus or on
  // a tap, since phones have no hover. A second tap, a tap elsewhere or Escape
  // closes it.
  let { label, text } = $props();
  const id = $props.id();
  let open = $state(false);
  // Escape hides it while the button keeps keyboard focus.
  let hush = $state(false);
  let el = $state();

  $effect(() => {
    if (!open) return;
    const away = (e) => {
      if (!el.contains(e.target)) open = false;
    };
    const esc = (e) => {
      if (e.key === 'Escape') open = false;
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  });
</script>

<span class="info" class:open class:hush bind:this={el}>
  <button
    type="button"
    aria-label="About {label}"
    aria-describedby={id}
    aria-expanded={open}
    onclick={() => (open = !open)}
    onkeydown={(e) => e.key === 'Escape' && ((hush = true), (open = false))}
    onblur={() => (hush = false)}>i</button
  >
  <span class="pop" role="tooltip" {id}>{text}</span>
</span>

<style>
  .info {
    position: relative;
    display: inline-block;
    vertical-align: 1px;
    margin-left: 3px;
  }
  button {
    display: inline-grid;
    place-items: center;
    width: 13px;
    height: 13px;
    padding: 0;
    border: 1px solid currentColor;
    border-radius: 50%;
    background: none;
    color: inherit;
    font: italic 700 9px/1 Georgia, serif;
    text-transform: none;
    cursor: pointer;
  }
  /* Right-aligned under the icon, since the columns it explains sit at the
     table's right edge. */
  .pop {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    right: -4px;
    z-index: 20;
    width: max-content;
    max-width: 220px;
    padding: 8px 10px;
    background: var(--surface);
    border: 1px solid var(--rule-strong);
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 400;
    line-height: 1.45;
    letter-spacing: normal;
    text-transform: none;
    text-align: left;
    white-space: normal;
  }
  /* Keyboard focus only: a tap also focuses the button, and would keep it open. */
  .open .pop,
  .info:not(.hush):has(button:focus-visible) .pop {
    display: block;
  }
  @media (hover: hover) {
    .info:hover .pop {
      display: block;
    }
  }
</style>
