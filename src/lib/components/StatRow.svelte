<script>
  let { stats, source = '', docsNote = false } = $props();
</script>

<div class="stats">
  {#each stats as s (s.k)}
    <div class="stat">
      {#if s.p}<div class="p">{s.p}</div>{/if}
      <div class="k">{s.k}</div>
      <div class="v">{s.v}</div>
      {#if s.n}<div class="n">{s.n}</div>{/if}
    </div>
  {/each}
</div>

{#if source}
  <p class="source"><span>Source</span>{source}{#if docsNote}{', documents are reports and maps'}{/if}</p>
{/if}
