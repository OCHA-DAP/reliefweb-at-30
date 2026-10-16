<script>
  import rw30 from '$lib/data/rw30.json';
  import dots from '$lib/data/country_dots.json';
  import search from '$lib/data/search_terms.json';
  import { fmt, completeCount } from '$lib/chart.js';
  import { aiDocsSpan } from '$lib/machines.js';
  import { readWindowShort, readDefinition } from '$lib/readwindow.js';
  import { BODY_WORDS } from '$lib/vocab.js';
  import Logos from './Logos.svelte';

  // The end of the story: the closing words, the logos and contact, then the
  // methods, on the same ReliefWeb band as the masthead, so the story opens and
  // closes alike.

  const N = completeCount(rw30.years);
  const last = rw30.years[N - 1];
  // The archive's size, as the masthead gives it.
  const total = rw30.by_year.slice(0, N).reduce((a, b) => a + b, 0);
  const jobsPct = Math.round((100 * search.events.all.jobs) / search.events.all.all_pages);
  const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const flagged = list(dots.countries.filter((c) => c.not_readers).map((c) => c.rw_short));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = (d) => `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;

  const METHODS = [
    {
      title: 'Chapter 1',
      text: `Yearly figures end in ${last}, the last complete year, unless otherwise noted. A document published by more than one type of organization counts once for each type. Publishing organizations are counted once a year, by type. A term's share is the share of documents with page text that mention it at least once. The ${BODY_WORDS} million words are the text of documents published 1996–${last}, as of 26 August 2026, not including PDF attachments.`
    },
    {
      title: 'Chapter 2',
      text: `Each disaster with at least one document and a start date from 1996 to ${last} is included, sized by its number of documents, over any period. Long-running crises collect documents for years, so the largest dots reflect duration as well as attention. The coverage charts count documents per month for the first 24 months after a disaster began.`
    },
    {
      title: 'Chapter 3',
      text: `Documents can be tagged with multiple countries, with one being the primary. The documents map counts by primary country, ${dots.docs_window[0]}–${dots.docs_window[1]}; ${fmt(dots.world_docs)} documents with no country are not mapped. The readers map counts visits that viewed at least one report or map, ${readWindowShort}, by the country Google Analytics places the browser in. VPNs and office networks can make this inaccurate. ${flagged} are excluded: their traffic averages under one page per visit across more than 100,000 visits, which points to automated traffic rather than readers. ${readDefinition} Searches cover ${mon(search.window[0])} to ${mon(search.window[1])}. Job and training searches, ${jobsPct} percent of all searches, are not included. Terms are ranked by engaged visits (over 10 seconds, or going on to a second page), because automated traffic inflates raw counts.`
    },
    {
      title: 'ReliefWeb Readership',
      text: `AI referrals are visits that start on a report or map and come from ChatGPT, Perplexity, Gemini, Copilot or Claude, as recorded by Google Analytics, ${aiDocsSpan}, complete months only. Firewall figures are requests to reliefweb.int blocked by the firewall's AI rule, from OCHA internal monitoring, ${readWindowShort}. A blocked request is not a visit or a reader. AI Overview citations are daily impressions of reliefweb.int in Google's AI Overviews, tracked from 18 May 2026, compared with engaged visits to reliefweb.int recorded by Google Analytics over the same days.`
    }
  ];
</script>

<footer class="band">
  <div class="wrap end">
    <blockquote class="close">
      <p>For thirty years, ReliefWeb has maintained a reliable record of humanitarian information.</p>
      <p>
        In this moment of AI acceleration, ReliefWeb’s archive of {(total / 1e6).toFixed(1)} million documents has never
        been more valuable. It provides a trusted foundation for informing current and future humanitarian efforts,
        amidst a rising tide of hallucinated figures and disinformation.
      </p>
      <p>
        ReliefWeb will continue to be a public good for the sector, always evolving to meet the information needs of
        humanitarians and fueling analysis and insights for years to come.
      </p>
    </blockquote>

    <Logos small white />
    <p class="contact">
      Contact <a href="mailto:feedback@reliefweb.int">feedback@reliefweb.int</a> with any questions or comments
    </p>

    <details class="method">
      <summary>Notes and methodology</summary>
      {#each METHODS as m (m.title)}
        <p><b>{m.title}.</b> {m.text}</p>
      {/each}
    </details>
  </div>
</footer>

<style>
  .band {
    background: var(--rw-band);
    color: #fff;
  }
  .end {
    max-width: 1180px;
    padding: 64px 24px 48px;
  }
  /* A pull quote: the step style, larger, in the display face, white on the
     band with a ReliefWeb cyan rule. */
  .close {
    font-family: 'Crimson Pro Variable', Crimson, Georgia, serif;
    font-size: 24px;
    line-height: 1.4;
    max-width: 40ch;
    margin: 0 0 56px;
    padding: 4px 0 4px 20px;
    border-left: 3px solid var(--rw-cyan);
  }
  .close p {
    margin: 0;
  }
  .close p + p {
    margin-top: 16px;
  }
  /* The methods, open or closed, as a light outline on the band. */
  .method {
    max-width: 82ch;
    margin: 0;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  .method summary {
    font-size: 15px;
    color: #fff;
  }
  .method summary:focus-visible {
    outline-color: #fff;
  }
  .method p {
    color: #fff;
    margin: 12px 0 0;
  }
  .contact {
    margin: 0 0 40px;
    font-size: 14px;
  }
  .contact a {
    color: #fff;
  }
  .contact a:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
  @media (max-width: 699px) {
    .end {
      padding: 48px 16px 40px;
    }
    .close {
      font-size: 21px;
    }
  }
</style>
