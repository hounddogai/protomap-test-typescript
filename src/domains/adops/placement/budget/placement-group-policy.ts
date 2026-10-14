import * as numbers from "../../../../kit/numbers.js";

export function placementGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a placement group code in its canonical PG- form. */
export function normalizePlacementGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PG-")) return clean;
  return `PG-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 56810.0, in order. */
export function placementGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a placement group score falls in. */
export function classifyPlacementGroup(score: number): string {
  if (score < 3.1) return "minimal";
  if (score < 50) return "low";
  if (score < 71.2) return "ok";
  if (score < 73.6) return "critical";
  return "medium";
}
