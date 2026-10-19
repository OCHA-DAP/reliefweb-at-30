<script>
  // ReliefWeb at 30 as one continuous scroll: three chapters, each a sticky graphic
  // whose marks re-arrange as its steps pass, then a close and the methods. Kept out
  // of search engines (noindex, here and in app.html) until launch.
  import rw30 from '$lib/data/rw30.json';
  import sources from '$lib/data/sources.json';
  import { fmt, completeCount } from '$lib/chart.js';
  import ActArchive from '$lib/story/ActArchive.svelte';
  import ActAttention from '$lib/story/ActAttention.svelte';
  import ActTwoWorlds from '$lib/story/ActTwoWorlds.svelte';
  import Coda from '$lib/story/Coda.svelte';
  import Close from '$lib/story/Close.svelte';
  import Logos from '$lib/story/Logos.svelte';
  import ChapterBar from '$lib/story/ChapterBar.svelte';

  let { data } = $props();

  const N = completeCount(rw30.years);
  const total = rw30.by_year.slice(0, N).reduce((a, b) => a + b, 0);
  const title = 'ReliefWeb’s 30th Anniversary';
  const description = `Since 1996, more than ${fmt(Math.floor(sources.orgs_1996_2025 / 100) * 100)} organizations have published ${(total / 1e6).toFixed(1)} million reports and maps about crises on ReliefWeb. This story explores the data behind the platform: what has been published, what we can learn about our readers, and how disasters have been covered over the last thirty years.`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <!-- Absolute, since link previews ignore relative image paths. -->
  <meta property="og:image" content="https://ocha-dap.github.io/reliefweb-at-30/share.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={title} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="robots" content="noindex" />
</svelte:head>

<ChapterBar />

<header class="band">
  <div class="wrap mast">
    <Logos white />
    <h1>ReliefWeb’s <span class="thirty">30th</span> Anniversary</h1>
    <p class="standfirst">
      Since 1996, more than {fmt(Math.floor(sources.orgs_1996_2025 / 100) * 100)} organizations have published
      {(total / 1e6).toFixed(1)} million reports and maps
      about crises on ReliefWeb. This story explores the data behind the platform — looking to understand what has
      been published, what we can learn about our readers, and how disasters have been covered over the last thirty
      years.
    </p>
    <p class="scroll">Scroll to begin <span aria-hidden="true">↓</span></p>
  </div>
</header>

<div class="wrap story">
  <ActArchive />
  <ActAttention layouts={data.swarm} />
  <ActTwoWorlds />
  <Coda />
</div>

<Close />

<style>
  /* The masthead: a full-width band in ReliefWeb's dark brand blue, as on
     reliefweb.int's footer, with the logos, title and intro in white. */
  .band {
    background: var(--rw-band);
    color: #fff;
  }
  .mast {
    max-width: 1180px;
    padding: 40px 24px 56px;
  }
  .mast h1 {
    margin-top: clamp(40px, 10svh, 112px);
    font-size: clamp(44px, 5.6vw, 72px);
    line-height: 1.02;
    margin-bottom: 24px;
    color: #fff;
  }
  .thirty {
    color: var(--rw-cyan);
  }
  .mast .standfirst {
    font-size: 19px;
    margin-bottom: 32px;
    color: #fff;
  }
  .scroll {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #fff;
  }
  .scroll span {
    display: inline-block;
    margin-left: 4px;
    letter-spacing: 0;
  }
  @media (max-width: 699px) {
    .mast {
      padding: 28px 16px 40px;
    }
    .mast h1 {
      margin-bottom: 16px;
    }
    .mast .standfirst {
      font-size: 17px;
    }
  }
  /* No padding below: the last figure's own margin is the gap before the
     closing band. */
  .story {
    max-width: 1180px;
    padding-bottom: 0;
  }
  .story :global(.act) {
    margin-top: 72px;
  }
  /* A chapter opened from a link (#disasters) clears the chapter bar. */
  .story :global(section[id]) {
    scroll-margin-top: 48px;
  }
  .story :global(.ahead) {
    border-top: 4px solid var(--rw-rule);
    padding-top: 20px;
  }
  .story :global(.anum) {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rw-line);
  }
  .story :global(.ahead h2) {
    font-size: 34px;
    margin: 0;
  }
  /* A titled section inside a chapter, a step below the chapter heading. */
  .story :global(.subhead) {
    font-family: 'Crimson Pro Variable', Crimson, Georgia, serif;
    font-size: 26px;
    font-weight: 700;
    margin: 56px 0 12px;
  }
  /* Text and figures after a chapter's pinned chart: well clear of it, so the
     chart is seen to end before the next thing begins. */
  .story :global(.inflow) {
    max-width: 900px;
    margin: 120px auto 0;
  }
  .story :global(.lede) {
    font-size: 19px;
    line-height: 1.55;
    max-width: 62ch;
    margin: 0 0 28px;
  }
  /* Lighter figures than the catalog's cards: a rule above, no box. */
  .story :global(figure.card) {
    border: 0;
    border-top: 2px solid var(--rw-rule);
    border-radius: 0;
    padding: 20px 0 8px;
    margin: 0 0 64px;
  }
  .story :global(figure.card h3) {
    font-size: 19px;
    line-height: 1.25;
    margin-bottom: 6px;
  }
  /* A short screen: less air above each chapter, so a chapter's heading and
     its chart fit on one screen. */
  @media (max-height: 760px) and (min-width: 700px) {
    .story :global(.act) {
      margin-top: 40px;
    }
    .story :global(.ahead) {
      padding-top: 14px;
    }
  }
  @media (max-width: 699px) {
    .story :global(.inflow) {
      margin-top: 64px;
    }
    .story :global(.ahead h2) {
      font-size: 28px;
    }
    .story :global(.lede) {
      font-size: 17px;
    }
  }
</style>
