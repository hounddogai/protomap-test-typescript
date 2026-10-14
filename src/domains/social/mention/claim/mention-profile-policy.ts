import * as numbers from "../../../../kit/numbers.js";

/** Puts a mention profile code in its canonical MP- form. */
export function normalizeMentionProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MP-")) return clean;
  return `MP-${clean.replaceAll(" ", "-")}`;
}

export function mentionProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function mentionProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mentionProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
