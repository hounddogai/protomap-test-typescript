import * as numbers from "../../../../kit/numbers.js";

export function funnelProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a funnel profile code in its canonical FP- form. */
export function normalizeFunnelProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FP-")) return clean;
  return `FP-${clean.replaceAll(" ", "-")}`;
}
