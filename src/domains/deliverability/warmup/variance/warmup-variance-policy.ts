import * as numbers from "../../../../kit/numbers.js";

/** Puts a warmup variance code in its canonical WV- form. */
export function normalizeWarmupVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WV-")) return clean;
  return `WV-${clean.replaceAll(" ", "-")}`;
}

export function warmupVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function warmupVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
