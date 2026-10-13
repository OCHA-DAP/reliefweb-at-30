<script>
  import rw30 from '$lib/data/rw30.json';
  import dots from '$lib/data/country_dots.json';
  import search from '$lib/data/search_terms.json';
  import peaks from '$lib/data/epidemic_peaks.json';
  import active from '$lib/data/ga_active_12m.json';
  import fw from '$lib/data/firewall.json';
  import { fmt, completeCount } from '$lib/chart.js';
  import { aiDocsBrief, aiDocsSpan } from '$lib/machines.js';
  import { readWindowShort } from '$lib/readwindow.js';
  import { BODY_WORDS } from '$lib/vocab.js';
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
      text: `Documents are reports and maps, counted by the year they were created. Job and training listings are not included. Yearly figures end in ${last}, the last complete year, unless otherwise noted. One square is 1,000 documents, rounded so the ${fmt(Math.round(rw30.by_year.slice(0, N).reduce((a, b) => a + b, 0) / 1000))} squares match the total. A document published by more than one type of organization counts once for each type. Media appears in the chart but is left out of the percentages in the text, because ReliefWeb stopped carrying newswire content around 2020–21. Publishing organizations are counted once a year, by type. A term's share is the share of documents with page text that mention it at least once. The ${BODY_WORDS} million words are the page text of documents created 1996–${last}, from the full document export of 26 August 2026, not including PDF attachments.`
    },
    {
      title: 'Chapter 2, How disasters are covered',
      text: `Each dot is a ReliefWeb disaster with at least one document and a start date from 1996 to ${last}, sized by its number of documents. Long-running crises collect documents for years, so the largest dots reflect duration as well as attention. The half-of-all-documents figure counts these disasters only. The coverage charts count documents per month for the first 24 months after a disaster began. The typical epidemic peak is measured the same way across all ${peaks.n} ReliefWeb epidemics with at least ${peaks.min_docs} documents that began in ${peaks.onset_from} or later and have 24 complete months. It leaves out ${peaks.left_out_multi_year.length} records covering several years, because their start date is when the record opened, not when an outbreak began.`
    },
    {
      title: 'Chapter 3, Which countries the documents cover, and where readers are',
      text: `The documents map counts documents by primary country, ${dots.docs_window[0]}–${dots.docs_window[1]}; ${fmt(dots.world_docs)} documents with no single country are not counted. The readers map counts visits that viewed at least one report or map, ${readWindowShort}, by the country Google Analytics places the browser in. VPNs and office networks can make this inaccurate. ${flagged} are left out: their traffic averages under one page per visit across more than 100,000 visits, which points to automated traffic rather than readers. Both maps show each country's share on the same five color bands, not adjusted for population. The ${(active.active_users / 1e6).toFixed(1)} million people are Google Analytics active users, ${active.window_display}; one person on two devices counts twice. Boundaries are fieldmaps' Global International Boundaries from HDX, simplified, in the Web Mercator projection. Searches cover ${mon(search.window[0])} to ${mon(search.window[1])}. Job and training searches, ${jobsPct}% of all searches, are not included. Terms are ranked by engaged visits (over 10 seconds, or going on to a second page), because automated traffic inflates raw counts.`
    },
    {
      title: 'ReliefWeb Readership: Today',
      text: `AI referrals are visits that start on a report or map and come from ChatGPT, Perplexity, Gemini, Copilot or Claude, as recorded by Google Analytics, ${aiDocsSpan}, complete months only. Firewall figures are requests to reliefweb.int blocked by the firewall's AI rule, from OCHA TSS's per-site firewall report, ${readWindowShort}. A blocked request is not a visit or a reader.`
    }
  ];
</script>

<section class="coda" id="close" aria-labelledby="h-coda">
  <h2 id="h-coda">ReliefWeb Readership: Today</h2>
  <p class="lede">
    As well as supplying ReliefWeb pages, the platform’s content powers other OCHA websites, alongside independent
    sites and apps via an API. Documents on ReliefWeb are also frequently cited by generative AI platforms: for
    example, Google search AI Overviews cites ReliefWeb 100,000 times a day. A growing number of readers arrive via
    links inside private AI chats. Readers no longer have to visit the platform to access its information.
  </p>
  <Figure
    id="coda-firewall"
    title="AI crawlers blocked on reliefweb.int"
    sub="Requests blocked by the firewall's AI rule, per month, {readWindowShort}"
    intro="AI platforms harvest ReliefWeb pages at scale to build up their databases. OCHA sometimes throttles access by AI crawlers to maintain site stability and control costs. In {month(rwMonths[rwLast])}, OCHA's firewall blocked {millions(rwAi[rwLast])} requests to ReliefWeb classed as AI harvesting, up from {millions(rwAi[0])} in {month(rwMonths[0])}."
    docsNote={false}
    source="OCHA TSS firewall logs"
    footnote="A request is any HTTP request blocked by the firewall's AI crawler rule, not equivalent to a page or a reader."
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
    <p>For thirty years, ReliefWeb has built a record of humanitarian information that people can trust.</p>
    <p>
      In this moment of AI acceleration, ReliefWeb’s archive has never been more valuable. It provides an important
      foundation for future humanitarian efforts, amidst a rising tide of hallucinated figures and disinformation.
    </p>
    <p>
      ReliefWeb is committed to continuing to provide a public good for the sector, always evolving to better meet the
      needs of humanitarians and to fuel analysis and insights for many years to come.
    </p>
  </blockquote>

  <Logos small />
  <details class="method">
    <summary>Notes and methodology</summary>
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
  .close p {
    margin: 0;
  }
  .close p + p {
    margin-top: 16px;
  }
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
