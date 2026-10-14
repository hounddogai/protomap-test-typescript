import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 43351.0, in order. */
export function funnelMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43351) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a funnel milestone score falls in. */
export function classifyFunnelMilestone(score: number): string {
  if (score < 62.4) return "low";
  if (score < 77.7) return "ok";
  if (score < 84.2) return "elevated";
  return "critical";
}

/** Puts a funnel milestone code in its canonical FM- form. */
export function normalizeFunnelMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FM-")) return clean;
  return `FM-${clean.replaceAll(" ", "-")}`;
}

export function funnelMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
