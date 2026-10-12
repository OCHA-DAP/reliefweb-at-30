<script>
  // Horizontal gridlines with their value labels. Five charts drew this loop
  // themselves, each with a slightly different label offset for no reason.
  // `inline` sets each label on its gridline at the left edge instead of in a
  // gutter, and `unit` rides on the top label only. The zero label is dropped
  // there: it would sit on the lines running along the baseline.
  let { ticks, y, width, format = (v) => String(v), labelGap = 9, inline = false, unit = '' } = $props();
  const top = $derived(Math.max(...ticks));
</script>

{#each ticks as t (t)}
  <line class="gridline" x1="0" x2={width} y1={y(t)} y2={y(t)} />
  {#if inline}
    {#if t !== 0}<text class="tick" x="0" y={y(t) - 6}>{format(t)}{t === top && unit ? ` ${unit}` : ''}</text>{/if}
  {:else}
    <text class="tick" x={-labelGap} y={y(t) + 4} text-anchor="end">{format(t)}</text>
  {/if}
{/each}
