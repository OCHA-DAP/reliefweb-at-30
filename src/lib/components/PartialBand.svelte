<script>
  // The shaded "this period is incomplete" band. The annual charts no longer
  // need it — they are cut at the last complete year — but the monthly series
  // still run to a part month, and that shading is a standing caveat of the
  // piece rather than a per-chart decision, so it is one component, not four.
  // The band is drawn on every such series; the PARTIAL text is not. Once the
  // convention is established by the first figure in a section, repeating the
  // word on every chart below it is noise, so callers pass label={false}.
  let { x, width, height, label = true, halo = false } = $props();
</script>

{#if x !== null}
  <rect class="partial" {x} y="0" width={width - x} {height} />
  {#if label}
    <!-- Sits on the axis, not in the annotation layer: the word qualifies the
         x range, and at the top it competed with the peak marks for the same
         corner of the plot at nearly the same baseline. -->
    <text class="partial-lab" class:halo x={x - 5} y={height - 5} text-anchor="end">PARTIAL</text>
  {/if}
{/if}

<style>
  /* Sits on filled bands in ShareArea, so it needs its own contrast there. */
  .halo {
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 3px;
    stroke-linejoin: round;
  }
</style>
