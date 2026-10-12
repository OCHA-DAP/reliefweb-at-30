<script>
  // The x axis for a categorical/temporal series: baseline plus thinned labels,
  // with the first and last anchored inward so they never clip the plot edge.
  // `centered` sets every label under its point (columns), moved in only as far
  // as the plot edge needs, at about 6px a character.
  let { labels, indices, x, width, height, format = (l) => l, centered = false } = $props();

  const at = (i) => {
    const half = (String(format(labels[i])).length * 6) / 2;
    return Math.min(width - half, Math.max(half, x(i)));
  };
</script>

<line class="axis-line" x1="0" x2={width} y1={height} y2={height} />
{#each indices as i (i)}
  <text
    class="tick"
    x={centered ? at(i) : x(i)}
    y={height + 18}
    text-anchor={centered ? 'middle' : i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>{format(labels[i])}</text
  >
{/each}
