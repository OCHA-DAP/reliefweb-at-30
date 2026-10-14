<script>
  // One claim per step. The id is a deep link (#a2-s3): the browser scrolls to
  // it and the observer sets the step, so the graphic follows.
  let { id, i, children } = $props();
</script>

<div class="step" {id} data-step={i}><p>{@render children()}</p></div>

<style>
  /* A full screen per step, so only one step's text is on screen at a time. The
     first takes the graphic's capped height instead, so the two line up before
     the graphic pins; the last need not be a full screen, as the chapter ends
     after it. Margins make up the difference, so every step's text sits a full
     screen below the one before (the second step's is set in Scrolly.svelte). */
  .step {
    min-height: 100svh;
    display: flex;
    align-items: center;
  }
  .step:first-child {
    min-height: var(--gh, min(88svh, 760px));
  }
  .step:last-child {
    min-height: 75svh;
    margin-top: 12.5svh;
  }
  p {
    margin: 0;
    max-width: 34ch;
    font-size: 19px;
    line-height: 1.5;
    background: #fff;
    border-left: 3px solid var(--rw-rule);
    padding: 14px 18px;
  }
  @media (max-width: 699px) {
    /* Centered, so the text sits on the reading line (steps.js) when its step
       is active. */
    .step,
    .step:first-child,
    .step:last-child {
      min-height: 60vh;
    }
    .step:last-child {
      margin-top: 0;
    }
    p {
      max-width: none;
      font-size: 17px;
    }
  }
</style>
