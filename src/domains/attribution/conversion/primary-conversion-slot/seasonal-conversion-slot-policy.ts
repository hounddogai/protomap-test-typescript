import * as numbers from "../../../../kit/numbers.js";

export function seasonalConversionSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a seasonal conversion slot code in its canonical SCS- form. */
export function normalizeSeasonalConversionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCS-")) return clean;
  return `SCS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 22714.0, in order. */
export function seasonalConversionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22714) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal conversion slot score falls in. */
export function classifySeasonalConversionSlot(score: number): string {
  if (score < 25.2) return "minimal";
  if (score < 46.8) return "elevated";
  if (score < 47.2) return "medium";
  if (score < 89.2) return "low";
  return "ok";
}
