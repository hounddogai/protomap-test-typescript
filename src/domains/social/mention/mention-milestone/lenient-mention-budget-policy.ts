import * as numbers from "../../../../kit/numbers.js";

export function lenientMentionBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a lenient mention budget code in its canonical LMB- form. */
export function normalizeLenientMentionBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LMB-")) return clean;
  return `LMB-${clean.replaceAll(" ", "-")}`;
}

export function lenientMentionBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
