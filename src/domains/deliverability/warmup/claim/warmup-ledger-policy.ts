import * as numbers from "../../../../kit/numbers.js";

/** Puts a warmup ledger code in its canonical WL- form. */
export function normalizeWarmupLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WL-")) return clean;
  return `WL-${clean.replaceAll(" ", "-")}`;
}

export function warmupLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
