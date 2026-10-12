<script>
  import { scaleLinear } from 'd3-scale';
  import { niceTop, MARGIN } from '$lib/chart.js';
  import { line as d3line, area as d3area } from 'd3-shape';
  import Gridlines from './Gridlines.svelte';
  import PartialBand from './PartialBand.svelte';

  // One panel of a small-multiples grid. Own y-scale, shared x.
  let {
    labels,
    values,
    color = 'var(--accent)',
    title,
    note = '',
    format = (v) => String(v),
    partialFrom = null,
    peakAt = null,
    xTicks = [],
    height = 116,
    // Width of the y-label gutter; a grid whose labels are short can narrow it.
    gutter = MARGIN.spark.l
  } = $props();

  let w = $state(0);

  const W = $derived(Math.max(100, w || 300));
  const M = $derived({ ...MARGIN.spark, l: gutter });
  const iw = $derived(W - M.l - M.r);
  const ih = $derived(height - M.t - M.b);

  const max = $derived(Math.max(...values, 0));
  const scaleY = $derived(niceTop(max, 3, 0.1));
  const topPad = 8;
  const x = $derived(scaleLinear().domain([0, labels.length - 1]).range([0, iw]));
  const y = $derived(scaleLinear().domain([0, scaleY.top]).range([ih, topPad]));

  // A null value is a month that has not happened yet: the line stops there.
  const has = (v) => v != null;
  const path = $derived(d3line().defined(has).x((_, i) => x(i)).y((v) => y(v))(values));
  const areaPath = $derived(d3area().defined(has).x((_, i) => x(i)).y0(ih).y1((v) => y(v))(values));

  const partialIdx = $derived(partialFrom ? labels.indexOf(partialFrom) : -1);
  // "Name, 2004" splits so a phone can set the year on its own line.
  const [, name, year] = $derived(title.match(/^(.*), (\d{4})$/) ?? [null, title, null]);
</script>

<div class="panel">
  <div class="ptitle">{name}{#if year}<span class="sep">, </span><span class="yr">{year}</span>{/if}</div>
  {#if note}<div class="pnote">{note}</div>{/if}
  <div class="chart" bind:clientWidth={w}>
    <svg viewBox="0 0 {W} {height}" width={W} {height} role="img" aria-label="{title}. {note}">
      <g transform="translate({M.l},{M.t})">
        <Gridlines ticks={max > 0 ? [0, scaleY.top] : [0]} {y} width={iw} {format} labelGap={7} />
        <PartialBand
          x={partialIdx > 0 ? x(partialIdx - 0.5) : null}
          width={iw}
          height={ih}
          label={false}
        />

        <path d={areaPath} fill={color} fill-opacity="0.12" />
        <path d={path} fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" />

        {#if peakAt != null && values[peakAt] != null}
          <circle
            cx={x(peakAt)}
            cy={y(values[peakAt])}
            r="3.2"
            fill={color}
            stroke="var(--surface)"
            stroke-width="1.5"
          />
        {/if}

        <line class="axis-line" x1="0" x2={iw} y1={ih} y2={ih} />
        {#each xTicks as t (t)}
          {@const i = labels.indexOf(t)}
          {#if i >= 0}
            <text
              class="tick"
              x={x(i)}
              y={ih + 15}
              text-anchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>{t}</text
            >
          {/if}
        {/each}

        {#each values as v, i (i)}
          <rect x={x(i) - iw / labels.length / 2} y="0" width={iw / labels.length} height={ih} fill="transparent">
            <title>{labels[i]}: {format(v)}</title>
          </rect>
        {/each}
      </g>
    </svg>
  </div>
</div>

<style>
  /* The chart sits at the foot of its grid cell, so panels in a row share a
     baseline when one title wraps to more lines than another. */
  .panel { min-width: 0; display: flex; flex-direction: column; }
  .chart { margin-top: auto; }
  /* On a phone the year takes its own line under the name. */
  @media (max-width: 699px) {
    .sep { display: none; }
    .yr { display: block; }
  }
  .ptitle { font-size: 12.5px; font-weight: 700; color: var(--ink); }
  /* pre-line: a note may set its own line break with \n. */
  .pnote { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; margin-bottom: 2px; white-space: pre-line; }
</style>
