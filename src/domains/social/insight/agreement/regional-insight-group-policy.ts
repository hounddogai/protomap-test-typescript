import * as numbers from "../../../../kit/numbers.js";

export function regionalInsightGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a regional insight group code in its canonical RIG- form. */
export function normalizeRegionalInsightGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RIG-")) return clean;
  return `RIG-${clean.replaceAll(" ", "-")}`;
}

export function regionalInsightGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 14129.0, in order. */
export function regionalInsightGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14129) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
