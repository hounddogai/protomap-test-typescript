import * as numbers from "../../../../kit/numbers.js";

/** Puts a default sender group code in its canonical DSG- form. */
export function normalizeDefaultSenderGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSG-")) return clean;
  return `DSG-${clean.replaceAll(" ", "-")}`;
}

export function defaultSenderGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultSenderGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
