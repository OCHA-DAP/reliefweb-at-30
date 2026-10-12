<script>
  import rw30 from '$lib/data/rw30.json';
  import dots from '$lib/data/country_dots.json';
  import search from '$lib/data/search_terms.json';
  import epilogue from '$lib/data/epilogue.json';
  import peaks from '$lib/data/epidemic_peaks.json';
  import active from '$lib/data/ga_active_12m.json';
  import fw from '$lib/data/firewall.json';
  import { fmt, completeCount } from '$lib/chart.js';
  import { aiDocsBrief, aiDocsSpan } from '$lib/machines.js';
  import { readWindowShort } from '$lib/readwindow.js';
  import AiDocsFigure from '$lib/components/AiDocsFigure.svelte';
  import Figure from '$lib/components/Figure.svelte';
  import Columns from '$lib/components/Columns.svelte';
  import archive from '$lib/data/archive.json';
  import Logos from './Logos.svelte';

  // The close: what reads ReliefWeb now, one line on what comes next, and the
  // methods, collapsed into one block.

  const N = completeCount(rw30.years);
  const last = rw30.years[N - 1];
  const jobsPct = Math.round((100 * search.events.all.jobs) / search.events.all.all_pages);
  const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const flagged = list(dots.countries.filter((c) => c.not_readers).map((c) => c.rw_short));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = (d) => `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;

  // AI requests blocked on reliefweb.int alone, from TSS's per-site report, over
  // the same months as the story's other reader figures (readwindow.js).
  const [rwFrom, rwTo] = archive.still_worth.window;
  const rwMonths = fw.months.slice(fw.months.indexOf(rwFrom), fw.months.indexOf(rwTo) + 1);
  const rwAi = rwMonths.map((m) => fw.ai_rwint[fw.months.indexOf(m)]);
  const rwPeak = rwAi.indexOf(Math.max(...rwAi));
  const rwLast = rwAi.length - 1;
  const millions = (v) => `${(v / 1e6).toFixed(1)} million`;
  const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = (d) => `${FULL[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;

  const METHODS = [
    {
      title: 'Chapter 1, Thirty years of publishing',
      text: `Documents are reports and maps, counted by the year they were created, 1996–${last}; jobs and training listings are left out throughout, and every year series stops at ${last}, the last complete year. One square stands for 1,000 documents; squares are rounded on the running total, so they add up to the rounded total of ${fmt(Math.round(rw30.by_year.slice(0, N).reduce((a, b) => a + b, 0) / 1000))}. Format and publisher colors divide each year's column by that year's shares. A co-published document counts once for each type of publisher crediting it, so publisher shares are shares of credits. Media is drawn but left out of every share quoted: ReliefWeb stopped carrying newswire content around 2020–21, and that change alone would lift every other publisher's share. Publishing organizations are counted once a year each, by their registry type. Term shares are document frequency, the share of body-bearing documents mentioning the term at least once, never word frequency.`
    },
    {
      title: 'Chapter 2, How disasters are covered',
      text: `One dot per ReliefWeb disaster record with at least one document and an onset from 1996 to ${last}, placed by onset month and sized by the documents tagged to it; protracted crises collect documents for years, so the largest dots measure duration as much as attention. The half-of-all-documents count is taken over those disasters only. Coverage curves count documents per month from onset over 24 months, for crises with all 24 months complete. The sentence on epidemics counts every ReliefWeb epidemic with at least ${peaks.min_docs} documents, an onset from ${peaks.onset_from} and 24 complete months, ${peaks.n} in all, the same way; ${peaks.left_out_multi_year.length} records spanning several years, whose month 0 is when the record opened rather than when an outbreak began, are left out.`
    },
    {
      title: 'Chapter 3, Which countries the documents cover, and where readers are',
      text: `The first map counts documents by primary country, ${dots.docs_window[0]}–${dots.docs_window[1]}; ${fmt(dots.world_docs)} filed under no single country are not counted. The second counts visits that viewed at least one report or map, ${readWindowShort}, by the country Google Analytics places the browser in: VPNs and headquarters networks distort it, and reader country is never content country. ${flagged} are left out of the visits map: under one page per visit across the whole site, on over 100,000 visits, which is data-center traffic rather than an audience. Both maps shade each country by its share, on the same five classes, not divided by population. The ${(active.active_users / 1e6).toFixed(1)} million people are Google Analytics active users, ${active.window_display}: browser identities, so one person on two devices counts twice; no loyalty or returning-visitor measure is used, since ${epilogue.new_user_pct}% of users are counted as new. Boundaries are fieldmaps' Global International Boundaries from HDX, simplified, on Web Mercator cropped to 56°S–75°N; labels sit at centroids from the OCHA countries and territories vocabulary on HDX. Searches run from ${mon(search.window[0])} to ${mon(search.window[1])}, past the end of ${last}, an exception to the rule above; job and training searches, ${jobsPct}% of all searches, are left out, and terms are ranked by engaged visits (over 10 seconds, or on to a second page) because automated traffic inflates raw counts and rarely does either.`
    },
    {
      title: 'Who reads it now',
      text: `AI referrals are visits whose first page is a report or map, credited to ChatGPT, Perplexity, Gemini, Copilot or Claude by the session source Google Analytics records, ${aiDocsSpan}, complete months only. Firewall figures are the CategoryAI rule on the reliefweb.int tab of OCHA TSS's per-site firewall report, ${readWindowShort}: one blocked request is one HTTP request matched by the firewall's AI-crawler rule, not a visit or a reader.`
    }
  ];
</script>

<section class="coda" id="close" aria-labelledby="h-coda">
  <h2 id="h-coda">Who reads it now</h2>
  <p class="lede">
    Not every reader arrives through ReliefWeb's own pages. Software outside OCHA pulls documents through its API,
    and AI crawlers are turned away in their millions: in {month(rwMonths[rwLast])}, OCHA's firewall blocked
    {millions(rwAi[rwLast])} requests to reliefweb.int it classed as AI harvesting, up from {millions(rwAi[0])} in
    {month(rwMonths[0])}. AI assistants, meanwhile, send people straight to ReliefWeb's documents.
  </p>
  <Figure
    id="coda-firewall"
    title="AI crawlers blocked on reliefweb.int"
    sub="Requests blocked by the firewall's AI rule, per month, {readWindowShort}"
    docsNote={false}
    source="OCHA TSS firewall logs"
    footnote="A blocked request is one HTTP request matched by the firewall's AI-crawler rule, not a visit or a reader. Counts are from TSS's per-site firewall report."
  >
    {#snippet chart()}
      <Columns
        labels={rwMonths}
        values={rwAi}
        name="reliefweb.int"
        tickEvery={3}
        tipFormat={fmt}
        labelFormat={(v) => `${(v / 1e6).toFixed(1)}M`}
        xFormat={mon}
        yUnit="requests"
        ariaLabel="Column chart of requests to reliefweb.int blocked by the firewall's AI rule each month, {readWindowShort}. They peaked at {fmt(rwAi[rwPeak])} in {mon(rwMonths[rwPeak])}."
      />
    {/snippet}
  </Figure>

  <AiDocsFigure
    id="coda-aidocs"
    num={null}
    title="AI assistants send readers to ReliefWeb's documents"
    sub="Visits starting on a report or map, by referring assistant, {aiDocsSpan}, complete months"
    docsNote
    intro={aiDocsBrief}
  />

  <blockquote class="close">
    For thirty years, ReliefWeb has built a record of humanitarian information that people can trust. Keeping that
    record open and findable, for the people who read it and for the software that increasingly reads on their behalf,
    is the work of ReliefWeb's next thirty years.
  </blockquote>

  <Logos small />
  <details class="method">
    <summary>How we measured this</summary>
    {#each METHODS as m (m.title)}
      <p><b>{m.title}.</b> {m.text}</p>
    {/each}
  </details>
</section>

<style>
  /* As wide as the chapters' in-flow figures (.inflow), and centered like them. */
  .coda :global(#coda-aidocs),
  .coda :global(#coda-firewall) {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }
  .coda :global(#coda-firewall) {
    margin-top: 56px;
  }
  .coda {
    margin-top: 40px;
    padding-top: 28px;
    border-top: 4px solid var(--accent);
  }
  /* A pull quote: the step style, larger, in the display face. */
  .close {
    font-family: 'Crimson Pro Variable', Crimson, Georgia, serif;
    font-size: 24px;
    line-height: 1.4;
    max-width: 40ch;
    margin: 40px 0 48px;
    padding: 4px 0 4px 20px;
    border-left: 3px solid var(--accent);
  }
  .method {
    padding-top: 18px;
    border-top: 1px solid var(--rule);
    font-size: 14px;
    line-height: 1.6;
    max-width: 82ch;
  }
  .method summary {
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }
  .method p {
    margin: 12px 0 0;
  }
</style>
