<script>
  import fw from '$lib/data/firewall.json';
  import { fmt, kfmt } from '$lib/chart.js';
  import { aiDocsBrief, aiDocsSpan } from '$lib/machines.js';
  import { readWindowShort } from '$lib/readwindow.js';
  import AiDocsFigure from '$lib/components/AiDocsFigure.svelte';
  import Figure from '$lib/components/Figure.svelte';
  import Columns from '$lib/components/Columns.svelte';
  import LineChart from '$lib/components/LineChart.svelte';
  import archive from '$lib/data/archive.json';
  import aio from '$lib/data/ai_overviews.json';

  // ReliefWeb readership today: how ReliefWeb is read now, by AI crawlers and
  // through AI assistants. The closing words and the methods follow, in Close.

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

  // Google AI Overview citations of reliefweb.int, from when tracking began to
  // the end of the story's reader window, against engaged visits to the site
  // over the same days. Said as floors: "more than" the daily average rounded
  // down to the hundred thousand, and the ratio rounded down.
  const aioTotal = aio.impressions.reduce((a, b) => a + b, 0);
  const aioDaily = fmt(Math.floor(aioTotal / aio.impressions.length / 1e5) * 1e5);
  const TIMES = ['', '', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times', 'nine times', 'ten times'];
  const aioTimes = TIMES[Math.floor(aioTotal / aio.engaged_visits.reduce((a, b) => a + b, 0))];
  // The same two counts by week, Monday to Sunday, full weeks only.
  const weeks = aio.dates.filter((_, i) => i % 7 === 0 && i + 7 <= aio.dates.length);
  const weekly = (xs) => weeks.map((_, w) => xs.slice(w * 7, w * 7 + 7).reduce((a, b) => a + b, 0));
  const aioWeeks = [
    { name: 'AI Overview citations', values: weekly(aio.impressions), color: 'var(--b4)' },
    { name: 'Engaged visits', values: weekly(aio.engaged_visits), color: 'var(--b1)' }
  ];
  const DAYMON = (d) => `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]}`;
  const lastSunday = (() => {
    const d = new Date(`${weeks[weeks.length - 1]}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().slice(0, 10);
  })();
  const aioSpan = `${DAYMON(weeks[0])} – ${DAYMON(lastSunday)} ${lastSunday.slice(0, 4)}`;
  const day = (d) => `${+d.slice(8, 10)} ${FULL[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
</script>

<section class="coda" id="close" aria-labelledby="h-coda">
  <h2 id="h-coda">ReliefWeb Readership: Today</h2>
  <p class="lede">
    ReliefWeb’s content powers other OCHA websites, alongside external sites and applications, via an API. Documents
    on ReliefWeb are also frequently cited by generative AI platforms. Google’s AI Overviews cite reliefweb.int more
    than {aioDaily} times a day on average. Between {day(aio.window[0])}, when tracking began, and the end of
    {FULL[+aio.window[1].slice(5, 7) - 1]}, that came to {millions(aioTotal)} citations, more than {aioTimes} the number
    of engaged visits to the site. A growing number of readers arrive via links inside private AI chats. Readers no
    longer have to visit ReliefWeb to access its information.
  </p>
  <Figure
    id="coda-aio"
    title="Google’s AI Overviews cite ReliefWeb more often than the site gets engaged visits"
    sub="Citations of reliefweb.int in Google’s AI Overviews, and engaged visits to reliefweb.int, per week, {aioSpan}"
    docsNote={false}
    source="Google Search Console and Google Analytics 4"
    footnote="A citation is one time an AI Overview citing reliefweb.int was shown on a Google results page; it does not show whether anyone read it. Engaged visits come from all sources, not only Google search."
  >
    {#snippet chart()}
      <LineChart
        labels={weeks}
        series={aioWeeks}
        height={300}
        tickEvery={7}
        format={kfmt}
        tipFormat={fmt}
        xFormat={DAYMON}
        yUnit="per week"
        maxTicks={4}
        headroom={0.1}
        inlineTicks
        inlineEndLabels
        alignEndLabels
        endLabelSize={13}
        endLabelMinWidth={0}
        ariaLabel="Line chart of weekly citations of reliefweb.int in Google's AI Overviews and weekly engaged visits to reliefweb.int, {aioSpan}. Citations ran at {fmt(Math.min(...aioWeeks[0].values))} to {fmt(Math.max(...aioWeeks[0].values))} a week, engaged visits at {fmt(Math.min(...aioWeeks[1].values))} to {fmt(Math.max(...aioWeeks[1].values))}."
      />
    {/snippet}
  </Figure>

  <Figure
    id="coda-firewall"
    title="AI crawlers blocked on reliefweb.int"
    sub="Requests blocked by ReliefWeb’s firewall, per month, {readWindowShort}"
    intro="AI platforms harvest ReliefWeb pages at scale to build up their databases. OCHA sometimes blocks access by AI crawlers to maintain site stability and control infrastructure costs. In {month(rwMonths[rwLast])}, OCHA's firewall blocked {millions(rwAi[rwLast])} requests to ReliefWeb classed as AI harvesting, up from {millions(rwAi[0])} requests in {month(rwMonths[0])}."
    docsNote={false}
    source="OCHA internal monitoring"
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
    sub="Visits starting on a report or map, by referring assistant, {aiDocsSpan}"
    docsNote
    intro={aiDocsBrief}
  />
</section>

<style>
  /* As wide as the chapters' in-flow figures (.inflow), and centered like them. */
  .coda :global(#coda-aidocs),
  .coda :global(#coda-aio),
  .coda :global(#coda-firewall) {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }
  .coda :global(#coda-aio),
  .coda :global(#coda-firewall) {
    margin-top: 56px;
  }
  .coda {
    margin-top: 40px;
    padding-top: 28px;
    border-top: 4px solid var(--rw-rule);
  }
</style>
