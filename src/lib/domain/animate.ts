interface AnimateCountUpOptions {
  from: number;
  to: number;
  durationMs: number;
  onUpdate: (value: number) => void;
  onDone: () => void;
}

export function animateCountUp({
  from,
  to,
  durationMs,
  onUpdate,
  onDone,
}: AnimateCountUpOptions): void {
  if (durationMs <= 0) {
    onUpdate(to);
    onDone();
    return;
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const current = Math.round(from + (to - from) * progress);
    onUpdate(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onDone();
    }
  };

  requestAnimationFrame(tick);
}
