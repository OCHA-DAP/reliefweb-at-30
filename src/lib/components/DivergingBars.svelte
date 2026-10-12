<script>
  import { scaleLinear } from 'd3-scale';

  // Ranked change, zero-centered. Rise and fall carry a colour each plus their
  // own side of the axis, so the encoding survives without hue.
  // The top strip is the axis legend: the unit, centered on zero, with an arrow
  // running out either side. It replaces a "fell"/"rose" pair, which was the
  // fourth encoding of direction on a chart that already carries it in the side
  // of the axis, the bar colour, the sign on every value and the sort order —
  // and which repeated the figure title verbatim.
  let {
    rows,
    ariaLabel,
    format = (v) => (v > 0 ? '+' : '') + v.toFixed(1),
    unit = '',
    // The endpoints the change is measured between, for the hover title. Defaults
    // are the vocabulary figure's, which was the only caller when this was written.
    fromLabel = '2000',
    toLabel = '2025',
    fallbackWidth = 1100
  } = $props();

  let w = $state(0);

  const W = $derived(Math.max(320, w || fallbackWidth));
  const BH = 20;
  const GAP = 9;
  const VALUE_GUTTER = 46;
  const M = $derived({
    t: 26,
    r: 64,
    b: 8,
    l: VALUE_GUTTER
  });
  const H = $derived(M.t + M.b + rows.length * (BH + GAP) - GAP);
  const iw = $derived(W - M.l - M.r);

  const extent = $derived(Math.max(...rows.map((r) => Math.abs(r.change))) * 1.05);
  const x = $derived(scaleLinear().domain([-extent, extent]).range([0, iw]));
  const zero = $derived(x(0));
  const AY = -16;
  // .axis-title is 10.5px uppercase with .08em tracking — wider per character
  // than labelGutter()'s 11px mixed-case estimate, so it gets its own constant.
  const unitW = $derived(unit.length * 7.1);
  // Arrows take whatever is left between the centered label and the plot edge,
  // so they shorten rather than overflow as the chart narrows.
  const AL = $derived(Math.min(56, zero - unitW / 2 - 10));
</script>

<div class="chart" bind:clientWidth={w}>
  <svg viewBox="0 0 {W} {H}" width={W} height={H} role="img" aria-label={ariaLabel}>
    <g transform="translate({M.l},{M.t})">
      {#if unit}
        <text class="axis-title" x={zero} y="-12" text-anchor="middle">{unit}</text>
        {#if AL > 14}
          {@const gap = unitW / 2 + 8}
          <line class="dir" x1={zero - gap} x2={zero - gap - AL} y1={AY} y2={AY} />
          <path
            class="dir"
            d="M{zero - gap - AL + 5},{AY - 3.5} L{zero - gap - AL},{AY} L{zero - gap - AL + 5},{AY + 3.5}"
          />
          <line class="dir" x1={zero + gap} x2={zero + gap + AL} y1={AY} y2={AY} />
          <path
            class="dir"
            d="M{zero + gap + AL - 5},{AY - 3.5} L{zero + gap + AL},{AY} L{zero + gap + AL - 5},{AY + 3.5}"
          />
        {/if}
      {/if}

      {#each rows as r, i (r.label)}
        {@const yy = i * (BH + GAP)}
        {@const up = r.change >= 0}
        <!-- Against the axis, not in a left gutter: a riser's bar leaves its
             left half empty and a faller's leaves its right half empty, so the
             name sits directly alongside the bar it belongs to. -->
        <text
          class="cat"
          x={up ? zero - 8 : zero + 8}
          y={yy + BH / 2 + 4}
          text-anchor={up ? 'end' : 'start'}
          >{r.label}</text
        >
        <rect
          x={up ? zero : x(r.change)}
          y={yy}
          width={Math.abs(x(r.change) - zero)}
          height={BH}
          rx="2"
          fill={up ? 'var(--up)' : 'var(--down)'}
        >
          <title>{r.label}: {r.from.toFixed(1)}% in {fromLabel}, {r.to.toFixed(1)}% in {toLabel}</title>
        </rect>
        <text
          class="dlabel"
          x={up ? x(r.change) + 7 : Math.max(x(r.change) - 7, -VALUE_GUTTER + 4)}
          y={yy + BH / 2 + 4}
          text-anchor={up ? 'start' : 'end'}
          fill={up ? 'var(--up)' : 'var(--down)'}>{format(r.change)}</text
        >
      {/each}

      <line x1={zero} x2={zero} y1="-4" y2={H - M.t - M.b} stroke="var(--rule-strong)" stroke-width="1" />
    </g>
  </svg>
</div>

<style>
  /* The axis legend is lighter than the bars and labels it explains: gray at the
     lightest shade that keeps small text readable (4.5:1 on white). */
  .axis-title {
    fill: #767676;
  }
  .dir {
    stroke: #767676;
    stroke-width: 1.25;
    fill: none;
  }
</style>
