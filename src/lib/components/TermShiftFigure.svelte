<script>
  import Figure from './Figure.svelte';
  import DivergingBars from './DivergingBars.svelte';
  import { settled as allSettled, added, EDITORIAL, EDITORIAL_NOTE, words, mark } from '$lib/vocab.js';

  // The terms whose use moved most; anything passed as children renders under
  // the chart.
  // `scale` false drops the intro's closing sentence on how common the terms
  // are, and `editorial` false leaves out the four terms the editors added by
  // hand, so every term is one the method selected and
  // the † footnote goes with them. `count` false leaves the number of terms out
  // of the subtitle and intro. `plain` swaps the subtitle and intro for ones in
  // everyday words.
  // `extra` adds terms from the later check of falling terms (vocab.js `added`).
  // `intro` replaces the figure's own intro; "" leaves it out.
  let { id = 'riserfaller', num = '2b', scale = true, editorial = true, count = true, plain = false, extra = [], intro = null, children } = $props();

  const settled = $derived(
    [...(editorial ? allSettled : allSettled.filter((r) => !EDITORIAL.has(r.label))), ...added.filter((r) => extra.includes(r.label))].sort(
      (a, b) => b.change - a.change
    )
  );

  // The worked example for the scale: the top riser's share in 2000 and 2025.
  const ex = $derived(settled[0]);
  // The biggest faller, for the plain intro's counterweight.
  const down = $derived(settled[settled.length - 1]);
  const per100 = (v) => Math.round(v);
  const plainIntro = $derived(
    `Some words appear in ReliefWeb documents far more often than they used to, and some far less. ` +
      `In 2000, ${per100(ex.from)} in every 100 documents mentioned ${ex.label}; by 2025, ${per100(ex.to)} did. ` +
      `${down.label[0].toUpperCase() + down.label.slice(1)} went the other way, from ${per100(down.from)} in 100 to ${per100(down.to)}. ` +
      `Each bar shows that change: how many more, or fewer, documents out of every 100 mention the word.`
  );
</script>

<Figure
  {id}
  {num}
  source="ReliefWeb API"
  title="The sector now talks more about protection, less about rehabilitation"
  sub={plain
    ? 'Change in how many documents out of every 100 mention each word, 2000 to 2025'
    : `Change in the share of documents mentioning each term, percentage points, 2000 → 2025${count ? `, ${settled.length} terms` : ''}`}
  intro={intro ?? (plain ? plainIntro : `${count ? `${words(settled.length, true)} humanitarian terms` : 'Humanitarian terms'}, ranked by how far their share of documents moved. Protection and resilience each gained about twelve points; rehabilitation lost fourteen. A point here is a percentage point: ${ex.label} went from ${Math.round(ex.from)}% of documents in 2000 to ${Math.round(ex.to)}% in 2025.${scale ? ' Scale matters too: even at its peak, localization appears in about one document in a hundred, protection in 27.' : ''}`)}
  footnote={editorial ? EDITORIAL_NOTE : null}
>
  {#snippet chart()}
    <DivergingBars
      rows={settled.map((r) => ({ ...r, label: mark(r.label) }))}
      unit={plain ? 'documents per 100' : 'percentage points'}
      ariaLabel="Diverging bar chart ranking {settled.length} humanitarian terms by change in document share between 2000 and 2025, in {plain ? 'documents per 100' : 'percentage points'}, from protection at plus 12.3 to rehabilitation at minus 14.3."
    />
  {/snippet}
  {#if children}{@render children()}{/if}
</Figure>
