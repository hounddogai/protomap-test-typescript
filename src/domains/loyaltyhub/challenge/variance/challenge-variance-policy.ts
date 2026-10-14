import * as numbers from "../../../../kit/numbers.js";

/** Puts a challenge variance code in its canonical CV- form. */
export function normalizeChallengeVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CV-")) return clean;
  return `CV-${clean.replaceAll(" ", "-")}`;
}

export function challengeVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function challengeVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
