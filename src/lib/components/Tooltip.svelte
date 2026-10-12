<script>
  // One tooltip, positioned from the pointer: the chart reports a client x/y and
  // the rows to show.
  let { tip } = $props();

  let w = $state(0);
  let h = $state(0);

  const left = $derived(Math.min(tip ? tip.x + 14 : 0, (globalThis.innerWidth ?? 1200) - w - 12));
  const top = $derived(Math.max(8, (tip ? tip.y : 0) - h - 14));
</script>

{#if tip}
  <div class="tip" style="left:{left}px; top:{top}px" bind:clientWidth={w} bind:clientHeight={h}>
    <div class="ty">{tip.title}</div>
    {#each tip.rows as row (row.name)}
      <div class="tr">
        <span class="nm">
          {#if row.color}<i style="background:{row.color}"></i>{/if}{row.name}
        </span>
        <b>{row.value}</b>
      </div>
    {/each}
  </div>
{/if}
