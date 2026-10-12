// Which step of a scrolly is active. One IntersectionObserver over the steps;
// among those on screen, the one whose center is nearest the reading line wins,
// and onstep fires only when that changes. The reading line is mid-viewport, or
// mid-way down the uncovered half on a phone, where the graphic pins over the
// top half of the screen.
export function stepObserver(onstep) {
  return (node) => {
    // .step only: the graphic carries data-step too, and being pinned mid-screen
    // it would always be nearest the line.
    const steps = [...node.querySelectorAll('.step[data-step]')];
    const visible = new Set();
    let current = -1;

    const pick = () => {
      const narrow = matchMedia('(max-width: 699px)').matches;
      const line = innerHeight * (narrow ? 0.75 : 0.5);
      let best = null;
      let dist = Infinity;
      for (const el of visible) {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - line);
        if (d < dist) {
          dist = d;
          best = el;
        }
      }
      const i = best ? +best.dataset.step : current;
      if (i !== current && i >= 0) {
        current = i;
        onstep(i);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        pick();
      },
      { threshold: [0, 0.25, 0.55, 0.75, 1] }
    );
    steps.forEach((s) => io.observe(s));
    // Thresholds alone miss the hand-over between two tall steps that are both
    // past 55%, so a passive scroll check settles it.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pick);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  };
}
