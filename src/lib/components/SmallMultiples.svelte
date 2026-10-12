<script>
  import Sparkline from './Sparkline.svelte';

  // A CSS grid of independent panels, not one SVG with manual translate math.
  // Pass `groups` instead of `panels` to label runs of panels. The heading spans
  // every column, so a group starts its own row. A grouped grid therefore takes
  // its column count from the largest group rather than from `min`: fitting as
  // many panels as the width allows would leave a gap at the end of every group.
  let {
    panels = null,
    groups = null,
    labels,
    format,
    partialFrom = null,
    xTicks = [],
    min = '240px',
    gutter = undefined,
    height = undefined
  } = $props();

  const cols = $derived(groups ? Math.max(...groups.map((g) => g.panels.length)) : null);
</script>

{#snippet panel(p)}
  <Sparkline
    {labels}
    values={p.values}
    color={p.color}
    title={p.title}
    note={p.note}
    peakAt={p.peakAt}
    {format}
    {partialFrom}
    {xTicks}
    {gutter}
    {height}
  />
{/snippet}

<div class="sm" style="--min:{min}; --cols:{cols}">
  {#each groups ?? [{ label: null, panels }] as g (g.label ?? '_')}
    {#if g.label}
      <h4 class="grp">{g.label}</h4>
    {/if}
    {#each g.panels as p (p.key ?? p.title)}
      {@render panel(p)}
    {/each}
  {/each}
</div>

<style>
  .sm {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--min), 100%), 1fr));
    gap: 18px 20px;
  }
  /* Same treatment as an axis title: this labels the panels below it, it is not
     a heading in the document's own hierarchy. */
  .grp {
    grid-column: 1 / -1;
    margin: 6px 0 -6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--rule);
    color: var(--muted);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .grp:not(:first-child) {
    margin-top: 14px;
  }
  .sm:has(.grp) {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  }
  /* Below this the panels are too narrow to read across, and any count but one
     puts a gap at the end of each group, so they stack. */
  @media (max-width: 860px) {
    .sm:has(.grp) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
