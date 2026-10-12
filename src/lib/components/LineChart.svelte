<script>
  import { scaleLinear } from 'd3-scale';
  import { line as d3line, area as d3area } from 'd3-shape';
  import { decollide, spreadLabels, kfmt, niceTop, labelGutter, MARGIN, GUTTER_END_LABELS, GUTTER_PLAIN, TOP_PAD } from '$lib/chart.js';
  import Tooltip from './Tooltip.svelte';
  import Gridlines from './Gridlines.svelte';
  import PartialBand from './PartialBand.svelte';
  import CategoryAxis from './CategoryAxis.svelte';
  import { hoverIndex } from '$lib/actions/hoverIndex.js';

  let {
    labels,                 // x-axis category labels, e.g. years
    series,                 // [{ name, values, color, labelColor? }]; labelColor sets the end-label value's color where the line's is too light to read
    ariaLabel,
    height = 330,
    format = kfmt,          // value formatter for the axis and end labels
    // Tooltips and the screen-reader readout state the exact value. The axis
    // abbreviates to keep gridline labels short, but abbreviating on hover
    // makes near-ties unreadable: 58,600 and 59,241 both render as "59k",
    // so the annotated peak looks equal to the year below it.
    tipFormat = format,
    partialFrom = null,     // label from which the data is incomplete
    partialLabel = true,    // the band is drawn regardless; this is the PARTIAL text
    // [{ label, at, anchor }] policy annotations. The label sits centered over the
    // top of its rule unless the caller passes an anchor to push it off to one
    // side, which is what a mark close to either edge of the plot needs.
    marks = [],
    cross = false,          // annotate where the first two series cross
    fill = false,           // area under a single-series line
    endLabels = true,
    // Print each end label's value and series name on one line, rather than the
    // value stacked over the name.
    inlineEndLabels = true,
    // With inline end labels, set the values in a right-aligned column and the
    // names in a left-aligned column after it.
    alignEndLabels = false,
    xFormat = (l) => l,     // format x-axis tick labels for display only
    labelAt = null,         // label the series at this x (default: last point)
    yMax = null,
    tickEvery = 5,
    maxTicks = 8,          // y gridline budget; short panels want fewer
    minTicks = 2,          // floor, for series a tight top would reduce to 0-and-top
    // Fraction of headroom niceTop leaves above the peak. The default keeps
    // annotation dots off the top gridline; a bounded axis (a 0-100% share that
    // naturally tops near 100) can pass 0 to let the top tick land on the bound.
    headroom = 0.03,
    yUnit = '',
    // Set the y labels on their gridlines at the left edge, the unit on the top one,
    // instead of in a left gutter.
    inlineTicks = false,
    // Length of the leader every end label hangs from. 0 draws one only where a
    // label was pushed off its line end.
    endLeader: endLeaderWide = 0,
    // End label font size in px, for a chart whose few labels can be larger;
    // 11px on a phone.
    endLabelSize: endLabelSizeWide = null,
    // Off for a chart driven by its own control (e.g. a slider moving a mark):
    // no hover line, tooltip or focusable capture area to compete with it.
    hoverable = true,
    // [{ at, label, span }] values labelled beside their point, for the first
    // series. Hung inward from the plot's edges so a label at either end stays
    // inside it. With span: [from, to], a label for a stretch of years sits
    // centered over a bracket across it, above the highest point in the stretch.
    // wide: true drops one on a phone.
    pointLabels = [],
    // Width assumed before bind:clientWidth reports. The charts render
    // server-side so the page works with no JavaScript, which means the first
    // paint has to guess; guessing the real column width keeps the correction
    // on hydration invisible instead of a visible snap.
    fallbackWidth = 1100,
    // Below this, the 144px end-label gutter is more than a third of the plot.
    endLabelMinWidth = 560
  } = $props();

  let w = $state(0);
  let tip = $state(null);
  let hover = $state(-1);
  // Series name whose end label is hovered; the other lines dim to isolate it.
  let focused = $state(null);

  const W = $derived(Math.max(320, w || fallbackWidth));
  // A phone-width plot can't spare the full leader.
  const endLeader = $derived(W < 560 ? Math.min(endLeaderWide, 14) : endLeaderWide);
  const endLabelSize = $derived(endLabelSizeWide && W < 560 ? 11 : endLabelSizeWide);
  const narrow = $derived(W < 560);
  // A mark's label on a phone, in two lines broken at the space nearest its middle.
  const wrap2 = (s) => {
    const mid = s.length / 2;
    const at = [...s].reduce((best, c, k) => (c === ' ' && Math.abs(k - mid) < Math.abs(best - mid) ? k : best), -1);
    return at < 0 ? [s] : [s.slice(0, at), s.slice(at + 1)];
  };
  const labelScale = $derived(endLabelSize ? endLabelSize / 11 : 1);
  const labelStyle = $derived(endLabelSize ? `font-size:${endLabelSize}px` : null);
  // Only honor endLabels when there is room for them.
  const showEndLabels = $derived(endLabels && W >= endLabelMinWidth);
  // Labels anchor to the last COMPLETE period by default, so the number shown
  // matches the prose rather than a partial final year.
  const li = $derived(labelAt != null ? labels.indexOf(labelAt) : labels.length - 1);
  // The 144px default fits most end labels; a long series name needs the gutter
  // measured from the label it actually has, or the text is clipped at the edge
  // of the svg.
  const M = $derived({
    ...MARGIN.series,
    t: yUnit ? 30 : MARGIN.series.t,
    l: inlineTicks ? 0 : MARGIN.series.l,
    r: showEndLabels ? endGutter + endLeader : GUTTER_PLAIN
  });
  // Larger labels are measured at about half an em a character (bold digits
  // and names together), and on a phone may take less than the usual gutter.
  const endGutter = $derived.by(() => {
    const texts = series.map((s) => `${format(s.values[li])} ${s.name}`);
    if (!endLabelSize) return Math.max(GUTTER_END_LABELS, labelGutter(texts, 16));
    const est = Math.ceil(Math.max(...texts.map((t) => t.length)) * 0.5 * endLabelSize) + 16;
    return W < 560 ? est : Math.max(GUTTER_END_LABELS, est);
  });
  const labelX = $derived(endLeader ? endLeader + 6 : 10);
  // The value column's width, from the longest value: .dlabel sets tabular
  // figures at 11.5px bold, about 6.6px a character.
  const charW = $derived(6.6 * (endLabelSize ? endLabelSize / 11.5 : 1));
  // In aligned labels a short value sits right of the column's start, so its
  // leader runs on to meet it.
  const leadPad = (s) =>
    inlineEndLabels && alignEndLabels ? valueW - `${format(s.values[li])}`.length * charW : 0;
  const valueW = $derived(
    Math.max(...series.map((s) => `${format(s.values[li])}`.length)) * charW
  );
  const iw = $derived(W - M.l - M.r);
  const ih = $derived(height - M.t - M.b);

  const dataMax = $derived(yMax ?? Math.max(...series.flatMap((s) => s.values)));
  const scaleY = $derived(niceTop(dataMax, maxTicks, headroom, minTicks));
  // Annotations sit above the top gridline, so they need the pad to themselves.
  const topPad = $derived(marks.length || cross ? 34 : TOP_PAD);
  const x = $derived(scaleLinear().domain([0, labels.length - 1]).range([0, iw]));
  const y = $derived(scaleLinear().domain([0, scaleY.top]).range([ih, topPad]));
  const yTicks = $derived(scaleY.ticks);

  const paths = $derived(
    series.map((s) => ({
      ...s,
      d: d3line()
        .defined((v) => v != null)
        .x((_, i) => x(i))
        .y((v) => y(v))(s.values),
      // A series can ask for its own fill, so one series can read as an envelope
      // while another stays a line. `fill` on the chart still fills every series.
      area: (s.fill ?? fill)
        ? d3area()
            .defined((v) => v != null)
            .x((_, i) => x(i))
            .y0(ih)
            .y1((v) => y(v))(s.values)
        : null
    }))
  );

  const endLabelRows = $derived.by(() => {
    if (!showEndLabels) return [];
    // Inline (value + name on one line) labels are a single text line, so they
    // need less vertical clearance than the stacked value-over-name form. Kept
    // just above the label's own height, so decollide only intervenes — and a
    // leader is only drawn — when labels would genuinely overlap.
    const gap = inlineEndLabels ? Math.round(15 * labelScale) : 30;
    const entries = series.map((s) => ({ s, y: y(s.values[li]), y0: y(s.values[li]) }));
    // With long leaders every label is tied to its line, so only labels that
    // actually overlap move; the rest keep a straight leader.
    if (endLeader) return spreadLabels(entries, gap, [10, ih]);
    const rows = decollide(
      entries,
      gap,
      // Labels sit in the right gutter, clear of the x-axis, so the lower bound
      // can reach the plot floor; a stricter bound made a near-zero label overflow
      // and shift the whole stack up, giving every other label a spurious leader.
      [10, ih]
    );
    // Snap a label flush to its line end (no leader) only when it sits well clear
    // of every other — a lone leader far above the pack, like the top series.
    // Without this, decollide's global overflow shift, triggered when the bottom
    // pack can't fit, nudges that isolated label off its own line. The threshold
    // is generous so a mere near-neighbor is not mistaken for isolation.
    const isoGap = gap * 2.5;
    for (const r of rows) {
      if (rows.every((o) => o === r || Math.abs(o.y0 - r.y0) >= isoGap)) r.y = r.y0;
    }
    return rows;
  });

  // With endLeader, displaced labels turn at staggered points, top label first,
  // so no two vertical runs share a line.
  const elbows = $derived.by(() => {
    const moved = endLabelRows.filter((r) => Math.abs(r.y - r.y0) > 3).sort((a, b) => a.y - b.y);
    const step = (endLeader - 5) / Math.max(1, moved.length);
    return new Map(moved.map((r, k) => [r.s.name, iw + 4 + k * step]));
  });

  const partialIdx = $derived(partialFrom ? labels.indexOf(partialFrom) : -1);
  const partialX = $derived(partialIdx > 0 ? x(partialIdx - 0.5) : null);

  const crossIdx = $derived.by(() => {
    if (!cross || series.length < 2) return -1;
    const [a, b] = series;
    for (let i = 1; i < labels.length; i++) {
      if ((a.values[i - 1] - b.values[i - 1]) * (a.values[i] - b.values[i]) < 0) return i;
    }
    return -1;
  });

  // Thin the x axis further when the plot is narrow, so labels never collide.
  const xStep = $derived(W < 480 ? tickEvery * 2 : tickEvery);
  // The last label is always shown to anchor the end; drop the preceding regular
  // tick when it would sit right next to it, or close enough to overprint (the
  // last is end-anchored, the one before centered, about 6px a character).
  const xTickIdx = $derived.by(() => {
    const last = labels.length - 1;
    const idx = labels.map((_, i) => i).filter((i) => i % xStep === 0);
    if (!idx.includes(last)) {
      const prev = idx[idx.length - 1];
      const room = idx.length && x(last) - x(prev) - String(xFormat(labels[last])).length * 6 - String(xFormat(labels[prev])).length * 3;
      if (idx.length && (last - prev < xStep / 2 || room < 8)) idx.pop();
      idx.push(last);
    }
    return idx;
  });

  const title = (i) => xFormat(labels[i]) + (partialIdx >= 0 && i >= partialIdx ? ' (partial)' : '');

  function show(i, cx, cy) {
    hover = i;
    tip = {
      x: cx,
      y: cy,
      title: title(i),
      rows: series
        .filter((s) => s.values[i] != null)
        .sort((a, b) => b.values[i] - a.values[i])
        .map((s) => ({ name: s.name, color: s.color, value: tipFormat(s.values[i]) }))
    };
  }
  function hide() {
    hover = -1;
    tip = null;
  }
</script>

<div class="chart" bind:clientWidth={w}>
  <svg viewBox="0 0 {W} {height}" width={W} {height} role="img" aria-label={ariaLabel}>
    <g transform="translate({M.l},{M.t})">
      <Gridlines ticks={yTicks} {y} width={iw} {format} inline={inlineTicks} unit={inlineTicks ? yUnit : ''} />
      <PartialBand x={partialX} width={iw} height={ih} label={partialLabel} />

      {#each paths as p (p.name)}
        {@const dim = focused != null && focused !== p.name}
        {#if p.area}
          <path class="smark" d={p.area} fill={p.color} fill-opacity={dim ? 0.03 : 0.13} />
        {/if}
        <!-- A series can carry `dash` and `width`: a reference ceiling should read as
             lighter than the series being read against it. -->
        <path
          class="smark"
          d={p.d}
          fill="none"
          stroke={p.color}
          stroke-width={p.width ?? 2.4}
          stroke-dasharray={p.dash ?? null}
          stroke-linejoin="round"
          opacity={dim ? 0.12 : 1}
        />
      {/each}

      <!-- Marks go under the point labels, whose halo masks a rule running behind them. -->
      {#each marks as m (m.label)}
        {@const i = labels.indexOf(m.at)}
        {#if i >= 0}
          <line class="annot-rule" x1={x(i)} x2={x(i)} y1={y(series[0].values[i]) - 7} y2="22" />
          <circle
            cx={x(i)}
            cy={y(series[0].values[i])}
            r="4.5"
            fill={series[0].color}
            stroke="var(--surface)"
            stroke-width="2"
          />
          {@const anchor = m.anchor ?? 'middle'}
          {@const lines = narrow ? wrap2(m.label) : [m.label]}
          <text
            class="annot"
            x={x(i) + (anchor === 'middle' ? 0 : anchor === 'end' ? 0 : 7)}
            y={18 - 15 * (lines.length - 1)}
            text-anchor={anchor}
            >{#each lines as line, k (k)}<tspan x={x(i) + (anchor === 'middle' ? 0 : anchor === 'end' ? 0 : 7)} dy={k ? 15 : 0}>{line}</tspan>{/each}</text
          >
        {/if}
      {/each}

      {#each pointLabels.filter((pl) => !(narrow && pl.wide)) as pl (pl.at)}
        {@const i = labels.indexOf(pl.at)}
        {#if i >= 0 && pl.span}
          {@const a = labels.indexOf(pl.span[0])}
          {@const b = labels.indexOf(pl.span[1])}
          {@const top = Math.min(...series[0].values.slice(a, b + 1).map((v) => y(v))) - 12}
          <path class="bracket" d="M{x(a)},{top + 4} V{top} H{x(b)} V{top + 4}" />
          <text class="annot plabel" class:halo={marks.length > 0} x={(x(a) + x(b)) / 2} y={top - 6} text-anchor="middle">{pl.label}</text>
        {:else if i >= 0}
          {@const atEnd = i > labels.length / 2}
          <circle cx={x(i)} cy={y(series[0].values[i])} r="4.5" fill={series[0].color} stroke="var(--surface)" stroke-width="2" />
          <text class="annot plabel" class:halo={marks.length > 0} x={x(i) + (atEnd ? -9 : 9)} y={y(series[0].values[i]) - 9} text-anchor={atEnd ? 'end' : 'start'}>{pl.label}</text>
        {/if}
      {/each}

      {#if crossIdx > 0 && iw > 380}
        <line
          class="annot-rule"
          x1={x(crossIdx)}
          x2={x(crossIdx)}
          y1={y(series[0].values[crossIdx]) - 6}
          y2="26"
        />
        <circle
          cx={x(crossIdx)}
          cy={y(series[0].values[crossIdx])}
          r="4.5"
          fill="var(--ink)"
          stroke="var(--surface)"
          stroke-width="2"
        />
        <text class="annot" x={x(crossIdx) + 8} y="22">curves cross, {labels[crossIdx]}</text>
      {/if}

      {#each endLabelRows as row (row.s.name)}
        {@const dim = focused != null && focused !== row.s.name}
        <g
          class="endlabel smark"
          opacity={dim ? 0.25 : 1}
          role="button"
          tabindex="-1"
          onmouseenter={() => (focused = row.s.name)}
          onmouseleave={() => (focused = null)}
        >
          {#if endLeader}
            {@const ex = elbows.get(row.s.name)}
            <path
              class="leader"
              d={ex == null
                ? `M${iw + 1},${row.y0} H${iw + endLeader + leadPad(row.s)}`
                : `M${iw + 1},${row.y0} H${ex} V${row.y} H${iw + endLeader + leadPad(row.s)}`}
              stroke={row.s.color}
            />
          {:else if Math.abs(row.y - row.y0) > 3}
            <path
              class="leader"
              d="M{iw + 1},{row.y0} L{iw + 4},{row.y0} L{iw + 6},{row.y - 4} L{iw + 8},{row.y - 4}"
              stroke={row.s.color}
            />
          {/if}
          {#if inlineEndLabels && alignEndLabels}
            <text class="dlabel" x={iw + labelX + valueW} y={row.y + 4} fill={row.s.labelColor ?? row.s.color} text-anchor="end" style={labelStyle}>
              {format(row.s.values[li])}
            </text>
            <text class="dlabel" x={iw + labelX + valueW + 4} y={row.y + 4}><tspan class="tick" style={labelStyle}>{row.s.name}</tspan></text>
          {:else if inlineEndLabels}
            <text class="dlabel" x={iw + labelX} y={row.y + 4} fill={row.s.labelColor ?? row.s.color} style={labelStyle}>
              {format(row.s.values[li])} <tspan class="tick" style={labelStyle}>{row.s.name}</tspan>
            </text>
          {:else}
            <text class="dlabel" x={iw + labelX} y={row.y} fill={row.s.labelColor ?? row.s.color}>
              {format(row.s.values[li])}
            </text>
            <text class="tick" x={iw + labelX} y={row.y + 14}>{row.s.name}</text>
          {/if}
        </g>
      {/each}

      <CategoryAxis {labels} indices={xTickIdx} {x} width={iw} height={ih} format={xFormat} />

      {#if yUnit && !inlineTicks}
        <text class="axis-title" x="0" y="-6">{yUnit}</text>
      {/if}

      {#if hover >= 0}
        <line x1={x(hover)} x2={x(hover)} y1="0" y2={ih} stroke="var(--rule-strong)" stroke-width="1" />
        {#each series as s (s.name)}
          <circle
            cx={x(hover)}
            cy={y(s.values[hover])}
            r="4.5"
            fill={s.color}
            stroke="var(--surface)"
            stroke-width="2"
          />
        {/each}
      {/if}

      {#if hoverable}
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
          valueText: (i) =>
            `${title(i)}: ${series
              .filter((s) => s.values[i] != null)
              .map((s) => `${s.name} ${tipFormat(s.values[i])}`)
              .join(', ')}`,
          onhover: show,
          onleave: hide
        }}
      />
      {/if}
    </g>
  </svg>
</div>

<Tooltip {tip} />

<style>
  .bracket {
    fill: none;
    stroke: var(--rule-strong);
    stroke-width: 1;
  }
  .plabel {
    font-weight: 600;
  }
  .plabel.halo {
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 5px;
    stroke-linejoin: round;
  }
  /* Lines, fills and end labels fade together when one series is isolated. */
  .smark {
    transition: opacity 0.15s ease, fill-opacity 0.15s ease;
  }
  .endlabel {
    cursor: default;
  }
  .endlabel:focus {
    outline: none;
  }
</style>
