<script module>
  import crisis from '$lib/data/crisis.json';
  import { fmt } from '$lib/chart.js';

  export const monthLabels = Array.from({ length: crisis.months }, (_, i) => String(i));

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ym = (s) => {
    const [y, m] = s.split('-');
    return m ? `${MON[+m - 1]} ${y}` : s;
  };

  // A crisis too recent for all 24 months has zeros for the months still to
  // come. Those are blanked, along with the current part month, so the line
  // stops at the last complete month instead of falling to zero.
  export const monthNum = (s) => +s.slice(0, 4) * 12 + +s.slice(5, 7);
  const lastComplete = monthNum(crisis.generated) - 1;
  // A crisis with fewer than 24 complete months is still unfolding: its peak
  // month and its half-way point so far are not its real ones, so it is marked
  // ongoing and shows neither.
  const monthsOf = (c) => Math.min(crisis.months, lastComplete - monthNum(c.onset) + 1);
  // Short labels from the pipeline, spelled out where the short form is unclear;
  // the readership figures expand the same one the same way.
  const TITLE = { 'C/E Africa Ebola': 'Central/Eastern Africa Ebola' };
  const panelOf = (c, brief = false) => {
    const ongoing = monthsOf(c) < crisis.months;
    return {
      title: (TITLE[c.label] ?? c.label) + (brief ? `, ${c.year}` : ''),
      values: c.series.map((v, i) => (monthNum(c.onset) + i <= lastComplete ? v : null)),
      // Epidemics behave differently enough to warrant their own colour: OCHA
      // orange against the blue of the sudden-onset events.
      color: c.epidemic ? 'var(--a-orange)' : 'var(--accent)',
      note: brief
        ? ''
        : ongoing
        ? `${ym(c.onset)}, ${fmt(c.total)} docs so far\nongoing: ${monthsOf(c)} months of data`
        : `${ym(c.onset)}, ${fmt(c.total)} docs in total\ncoverage peaks in month ${c.peak_month}, ${c.half_life == null ? `half posted after month ${crisis.months - 1}` : `half posted by month ${c.half_life}`}`,
      peakAt: ongoing ? null : c.peak_month,
      key: c.name
    };
  };

  // Grouped by ReliefWeb's own primary disaster type, three to a type so each one
  // is a single row of the three-column grid. ReliefWeb files Haiyan, Idai and
  // Nargis as tropical cyclones; the heading names what they did to the ground.
  // Epidemics come last: they are the exception the figure is about.
  //
  // Three crises in crisis.json are deliberately not here. Nepal 2015 and Pakistan
  // floods 2010 are the fourth of their type and add no shape the other three do
  // not already show; DR Congo 2025 drew 88 documents, too few for a curve. The
  // curves still exist for the readership figures.
  const CRISIS_TYPE = {
    'South Asia: Earthquake and Tsunami - Dec 2004': 'Earthquakes',
    'Haiti: Earthquakes - Jan 2010': 'Earthquakes',
    'Türkiye/Syria: Earthquakes - Feb 2023': 'Earthquakes',
    'Myanmar: Tropical Cyclone Nargis - May 2008': 'Floods and storms',
    'Typhoon Haiyan - Nov 2013': 'Floods and storms',
    'Tropical Cyclone Idai - Mar 2019': 'Floods and storms',
    'West Africa: Ebola Outbreak - Mar 2014': 'Epidemics',
    'DR Congo: Ebola Outbreak - Aug 2018': 'Epidemics',
    'Central/Eastern Africa: Ebola Outbreak - May 2026': 'Epidemics',
    'Nigeria: Yellow Fever Outbreak - Sep 2017': 'Epidemics'
  };
  // Shown only in the story, where the 2026 outbreak is left out and this fills its place:
  // an epidemic that is not Ebola, near the typical peak month (epidemic_peaks.py).
  const STORY_ONLY = new Set(['Nigeria: Yellow Fever Outbreak - Sep 2017']);
  const TYPE_ORDER = ['Earthquakes', 'Floods and storms', 'Epidemics'];
  // `keep` chooses the curves: by default every one above but the story-only one;
  // the story keeps those with all 24 months, since it stops at 2025, and puts only
  // the onset year in the title, with no note (`brief`).
  export const crisisGroups = (keep = (c) => !STORY_ONLY.has(c.name), { brief = false } = {}) =>
    TYPE_ORDER.map((label) => ({
      label,
      panels: crisis.curves.filter((c) => CRISIS_TYPE[c.name] === label && keep(c)).map((c) => panelOf(c, brief))
    })).filter((g) => g.panels.length);
  export const complete = (c) => monthsOf(c) === crisis.months;
  export const shortK = (v) =>
    v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(Math.round(v));
</script>

<script>
  import Figure from './Figure.svelte';
  import SmallMultiples from './SmallMultiples.svelte';

  // How coverage of a crisis unfolds month by month, as a figure card.
  let { id = 'crisisshape', num = '4c' } = $props();

  const groups = crisisGroups();
</script>

<Figure
  {id}
  {num}
  source="ReliefWeb API"
  title="Coverage peaks early, except for epidemics"
  sub="Documents per month from onset, 24 months, nine crises, three of each disaster type"
  intro="Sudden-onset events behave alike: they peak in the first month and reach half their lifetime coverage within two to six months. Epidemics peak far later, West Africa Ebola at month 7 and DR Congo 2018 at month 11. The shape tracks how fast an event arrives rather than how much attention it draws, though these curves show the timing only and not what causes it. Orange marks the epidemics."
  footnote="Each panel has its own y-axis: these show shape, not relative size. Months count from the month of onset, which is month 0. Coverage peaks in month N names the month with the most new documents; half posted by month N is when half of all the documents tagged to the crisis had been posted. A crisis with less than 24 months of data so far is marked ongoing and shows neither."
>
  {#snippet chart()}
    <SmallMultiples
      {groups}
      labels={monthLabels}
      format={shortK}
      xTicks={['0', '12', '23']}
      min="250px"
      gutter={26}
    />
  {/snippet}
</Figure>
