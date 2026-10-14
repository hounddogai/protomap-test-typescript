import * as numbers from "../../../../kit/numbers.js";

export function slaPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a sla preference code in its canonical SP- form. */
export function normalizeSlaPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SP-")) return clean;
  return `SP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 42726.0, in order. */
export function slaPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42726) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function slaPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
