import * as numbers from "../../../../kit/numbers.js";

export function scheduledMacroQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a scheduled macro quota code in its canonical SMQ- form. */
export function normalizeScheduledMacroQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMQ-")) return clean;
  return `SMQ-${clean.replaceAll(" ", "-")}`;
}

export function scheduledMacroQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
