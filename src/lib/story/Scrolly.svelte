<script>
  import { stepObserver } from './steps.js';

  // A sticky graphic beside the steps that drive it. The graphic is told which
  // step is active through data-step, and the act reads `step` to pick its view.
  // Below 700px the graphic pins over the top half of the screen and the steps
  // scroll up beneath it. `wide` gives the graphic most of the width, for a map.
  let { id, step = $bindable(0), source, wide = false, graphic, children } = $props();
  // The graphic's own height, so it can pin centered on the screen without a
  // fixed box around it (Step reads it too, as --gh).
  let gh = $state(0);
</script>

<div class="scrolly" class:wide {id} style={gh ? `--gh:${gh}px` : null} {@attach stepObserver((i) => (step = i))}>
  <div class="graphic" data-step={step} bind:offsetHeight={gh}>
    <div class="stage">{@render graphic()}</div>
    {#if source}<p class="source"><span>Source</span>{source}</p>{/if}
  </div>
  <div class="steps">{@render children()}</div>
</div>

<style>
  .scrolly {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 40px;
    position: relative;
  }
  /* As tall as what it shows, and pinned with its center on the screen's
     center, the line a step is read on (steps.js). Before it pins it sits
     straight under the chapter heading, with no empty box above it. The first
     step takes the same height (Step.svelte), so the two line up. Until the
     height is measured, the old cap stands in. */
  .graphic {
    position: sticky;
    align-self: start;
    top: calc(50svh - var(--gh, min(88svh, 760px)) / 2);
    display: flex;
    flex-direction: column;
    padding: 24px 0;
  }
  .wide {
    grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.45fr);
    gap: 28px;
  }
  .wide .graphic {
    padding: 12px 0;
  }
  .stage {
    position: relative;
    min-height: 0;
  }
  .source {
    margin-top: 8px;
  }
  .steps {
    padding: 0 0 20svh;
  }
  /* The first step is only as tall as the graphic, so the second is pushed down
     until its text sits a full screen below the first's (Step.svelte). */
  .steps > :global(.step:first-child + .step) {
    margin-top: max(0px, 50svh - var(--gh, min(88svh, 760px)) / 2);
  }
  .steps > :global(.step:first-child + .step:last-child) {
    margin-top: calc(max(0px, 50svh - var(--gh, min(88svh, 760px)) / 2) + 12.5svh);
  }
  @media (max-width: 699px) {
    .scrolly,
    .wide {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    .graphic {
      top: 0;
      align-self: stretch;
      height: 50svh;
      justify-content: center;
      background: #fff;
      border-bottom: 1px solid var(--rule);
      z-index: 1;
      padding: 8px 0;
    }
    .source {
      font-size: 10.5px;
      margin-top: 4px;
    }
    .steps {
      padding: 20svh 0 30svh;
    }
    .steps > :global(.step:first-child + .step),
    .steps > :global(.step:first-child + .step:last-child) {
      margin-top: 0;
    }
  }
</style>
