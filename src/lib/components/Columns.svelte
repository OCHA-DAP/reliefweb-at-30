<script>
  import { scaleLinear } from 'd3-scale';
  import { kfmt, niceTop } from '$lib/chart.js';
  import Tooltip from './Tooltip.svelte';
  import Gridlines from './Gridlines.svelte';
  import CategoryAxis from './CategoryAxis.svelte';
  import { hoverIndex } from '$lib/actions/hoverIndex.js';

  // One column per period on a zero baseline, each labelled with its value where
  // the columns are wide enough to carry it.
  let {
    labels,
    values,
    color = 'var(--accent)',
    name = '',
    ariaLabel,
    height = 280,
    format = kfmt,
    tipFormat = format,
    labelFormat = format,
    xFormat = (l) => l,
    tickEvery = 3,
    yUnit = '',
    fallbackWidth = 900
  } = $props();

  let w = $state(0);
  let tip = $state(null);
  let hover = $state(-1);

  const W = $derived(Math.max(300, w || fallbackWidth));
  const M = $derived({ t: yUnit ? 30 : 18, r: 4, b: 32, l: 0 });
  const iw = $derived(W - M.l - M.r);
  const ih = $derived(height - M.t - M.b);

  const scaleY = $derived(niceTop(Math.max(...values.filter((v) => v != null))));
  const x = $derived(scaleLinear().domain([-0.5, labels.length - 0.5]).range([0, iw]));
  const y = $derived(scaleLinear().domain([0, scaleY.top]).range([ih, 12]));
  const band = $derived(iw / labels.length);
  const bw = $derived(band * 0.5);
  const showValues = $derived(band >= 44);

  const xStep = $derived(W < 480 ? tickEvery * 2 : tickEvery);
  const xTickIdx = $derived.by(() => {
    const last = labels.length - 1;
    const idx = labels.map((_, i) => i).filter((i) => i % xStep === 0);
    if (!idx.includes(last)) {
      if (idx.length && last - idx[idx.length - 1] < xStep / 2) idx.pop();
      idx.push(last);
    }
    return idx;
  });
</script>

<div class="chart" bind:clientWidth={w}>
  <svg viewBox="0 0 {W} {height}" width={W} {height} role="img" aria-label={ariaLabel}>
    <g transform="translate({M.l},{M.t})">
      <Gridlines ticks={scaleY.ticks} {y} width={iw} {format} inline unit={yUnit} />
      {#each labels as l, i (l)}
        {#if values[i] != null}
          <g class="col" class:dim={hover >= 0 && hover !== i}>
            <rect x={x(i) - bw / 2} y={y(values[i])} width={bw} height={ih - y(values[i])} fill={color} />
            {#if showValues}
              <text class="vlabel" x={x(i)} y={y(values[i]) - 5} text-anchor="middle">{labelFormat(values[i])}</text>
            {/if}
          </g>
        {/if}
      {/each}
      <CategoryAxis {labels} indices={xTickIdx} {x} width={iw} height={ih} format={xFormat} centered />
      <rect
        class="capture"
        x="0"
        y="0"
        width={iw}
        height={ih}
        fill="transparent"
        use:hoverIndex={{
          scale: x,
          count: labels.length,
          label: ariaLabel,
          valueText: (i) => `${xFormat(labels[i])}: ${values[i] == null ? 'no figure' : tipFormat(values[i])}`,
          onhover: (i, cx, cy) => {
            hover = i;
            tip = {
              x: cx,
              y: cy,
              title: xFormat(labels[i]),
              rows: [{ name, color, value: values[i] == null ? 'no figure' : tipFormat(values[i]) }]
            };
          },
          onleave: () => {
            hover = -1;
            tip = null;
          }
        }}
      />
    </g>
  </svg>
</div>

<Tooltip {tip} />

<style>
  .col {
    transition: opacity 0.15s ease;
  }
  .col.dim {
    opacity: 0.45;
  }
  .vlabel {
    font-size: 11px;
    font-weight: 600;
    fill: var(--ink);
  }
</style>
