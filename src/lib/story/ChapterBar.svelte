<script>
  import { onMount } from 'svelte';

  // A slim bar of chapter links that slides in when the reader scrolls up, the
  // usual sign they are looking for something, and slides away when they read
  // on down. Hidden over the opening screen. The chapter being read is marked.
  const CHAPTERS = [
    { id: 'publishing', label: 'Publishing' },
    { id: 'disasters', label: 'Disasters' },
    { id: 'readers', label: 'Countries and readers', short: 'Countries' },
    { id: 'close', label: 'ReliefWeb readership today', short: 'Readers now' }
  ];

  let shown = $state(false);
  let focused = $state(false);
  let current = $state(null);
  let inner = $state();

  // On a phone the links run past the edge; keep the current one in view.
  $effect(() => {
    const a = current && inner?.querySelector(`a[href="#${current}"]`);
    if (a) inner.scrollTo({ left: Math.max(0, a.offsetLeft - 16), behavior: 'smooth' });
  });

  onMount(() => {
    let lastY = scrollY;
    let raf = 0;
    const update = () => {
      const y = scrollY;
      const firstTop = document.getElementById(CHAPTERS[0].id).getBoundingClientRect().top;
      if (firstTop > innerHeight / 2) shown = false;
      else if (y < lastY - 4) shown = true;
      else if (y > lastY + 4) shown = false;
      lastY = y;
      current = CHAPTERS.findLast((c) => document.getElementById(c.id).getBoundingClientRect().top <= innerHeight * 0.4)?.id ?? null;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  });
</script>

<nav
  class="chapbar"
  class:shown={shown || focused}
  aria-label="Chapters"
  onfocusin={() => (focused = true)}
  onfocusout={() => (focused = false)}
>
  <div class="inner" bind:this={inner}>
    {#each CHAPTERS as c (c.id)}
      <a href="#{c.id}" class:on={current === c.id} aria-current={current === c.id ? 'location' : undefined}
        >{#if c.short}<span class="long">{c.label}</span><span class="short">{c.short}</span>{:else}{c.label}{/if}</a
      >
    {/each}
  </div>
</nav>

<style>
  .chapbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: #fff;
    border-bottom: 1px solid var(--rule);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateY(-100%);
    transition: transform 0.25s ease;
  }
  .chapbar.shown {
    transform: none;
  }
  .inner {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 24px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .inner::-webkit-scrollbar {
    display: none;
  }
  a {
    flex: none;
    padding: 11px 0 9px;
    border-bottom: 2px solid transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    white-space: nowrap;
  }
  a:hover {
    color: var(--accent-text);
  }
  a.on {
    color: var(--accent-text);
    border-bottom-color: var(--accent);
  }
  .short {
    display: none;
  }
  @media (max-width: 699px) {
    .inner {
      padding: 0 16px;
      gap: 18px;
    }
    a {
      font-size: 12.5px;
    }
    /* Short names, so all four fit across a phone. */
    .long {
      display: none;
    }
    .short {
      display: inline;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .chapbar {
      transition: none;
    }
  }
</style>
