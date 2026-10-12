<script>

  // Every chart on the page sits in one of these: title, a short intro explaining
  // what the chart is, the chart itself, and the
  // caveat that travels with the figure.
  let {
    id,
    // Reference label. Charts answering one question share a number and take a
    // letter each, so "12a and 12b" names a pair rather than two loose figures.
    num = '',
    title,
    sub = '',
    intro = '',
    footnote = '',
    source = '',
    // Charts that count documents say what a document is, so an exported image
    // carries the definition with it. Off for the few that count something else.
    docsNote = true,
    legend = null,
    controls,
    chart,
    children
  } = $props();

  const titleId = `h-${id}`;
</script>

<!-- The id is the figure's anchor (…/#readercountry); the number links to it so
     a reader can copy a link to one figure. -->
<figure class="card" {id} aria-labelledby={titleId}>
  {#if num}<p class="fignum"><a href="#{id}">Figure {num}</a></p>{/if}
  <h3 id={titleId}>{title}</h3>
  {#if sub}<p class="sub">{sub}</p>{/if}
  {#if intro}<p class="intro">{intro}</p>{/if}

  {#if controls}<div class="controls">{@render controls()}</div>{/if}

  <!-- A legend entry carrying `onclick` becomes the control for its own series,
       which is a shorter trip than a separate row of buttons saying the same
       words. Entries without one stay plain text. -->
  {#if legend}
    <div class="legend">
      {#each legend as l (l.name)}
        <!-- A legend entry with shape: 'circle' draws a dot, to match a chart
             whose marks are dots rather than bars or areas. -->
        {@const swatch = l.dash
          ? null
          : `background:${l.color}${l.shape === 'circle' ? '; border-radius:50%' : ''}`}
        {#if l.onclick}
          <button
            class="lg lgbtn"
            type="button"
            aria-pressed={l.active === true}
            class:on={l.active === true}
            onclick={l.onclick}
          >
            <i style={swatch}></i>{l.name}{#if l.mark}<span class="lgmark">{l.mark}</span>{/if}</button
          >
        {:else}
          <span class="lg">
            {#if l.dash}
              <svg class="lgline" viewBox="0 0 16 4" aria-hidden="true"
                ><line x1="0" y1="2" x2="16" y2="2" stroke={l.color} stroke-width="2.5" stroke-dasharray={l.dash} /></svg
              >
            {:else}
              <i style={swatch}></i>
            {/if}{l.name}</span
          >
        {/if}
      {/each}
    </div>
  {/if}

  {@render chart()}

  {#if children}{@render children()}{/if}


  {#if footnote}<p class="note">{footnote}</p>{/if}
  {#if source}<p class="source"><span>Source</span>{source}{#if docsNote}{', documents are reports and maps'}{/if}</p>{/if}
</figure>

<style>
  .card {
    margin-inline: 0;
    scroll-margin-top: 16px;
  }
  .fignum {
    margin: 0 0 2px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-text);
  }
  .fignum a {
    color: inherit;
    text-decoration: none;
  }
  .fignum a:hover {
    text-decoration: underline;
  }
  .intro {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--ink-2);
    margin: 0 0 16px;
    max-width: 74ch;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .lgbtn {
    border: 0;
    background: none;
    padding: 2px 4px;
    margin: -2px -4px;
    border-radius: 4px;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .lgbtn:hover {
    background: var(--rule);
  }
  .lgbtn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  /* The active entry is marked rather than the others being dimmed: both series are
     still drawn, so dimming one would say something untrue about the chart. */
  .lgbtn.on {
    font-weight: 700;
  }
  .lgmark {
    margin-left: 5px;
    font-weight: 700;
  }
</style>
