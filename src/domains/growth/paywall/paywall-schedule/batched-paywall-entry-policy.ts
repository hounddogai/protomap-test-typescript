import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched paywall entry code in its canonical BPE- form. */
export function normalizeBatchedPaywallEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPE-")) return clean;
  return `BPE-${clean.replaceAll(" ", "-")}`;
}

export function batchedPaywallEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function batchedPaywallEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
