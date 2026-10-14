import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback conversion mapping code in its canonical FCM- form. */
export function normalizeFallbackConversionMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCM-")) return clean;
  return `FCM-${clean.replaceAll(" ", "-")}`;
}

export function fallbackConversionMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackConversionMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 26392.0, in order. */
export function fallbackConversionMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26392) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
