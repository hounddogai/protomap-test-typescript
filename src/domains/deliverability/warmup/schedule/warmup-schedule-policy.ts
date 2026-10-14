/** Counts how many amounts fit in a budget of 79900.0, in order. */
export function warmupScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79900) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a warmup schedule code in its canonical WS- form. */
export function normalizeWarmupScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WS-")) return clean;
  return `WS-${clean.replaceAll(" ", "-")}`;
}

export function warmupScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a warmup schedule score falls in. */
export function classifyWarmupSchedule(score: number): string {
  if (score < 19.9) return "watch";
  if (score < 30.3) return "high";
  if (score < 65.7) return "medium";
  if (score < 72) return "critical";
  return "ok";
}
