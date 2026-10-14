import * as numbers from "../../../../kit/numbers.js";

export function lenientMacroEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function lenientMacroEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
