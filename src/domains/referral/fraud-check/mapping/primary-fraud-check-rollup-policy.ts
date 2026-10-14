import * as numbers from "../../../../kit/numbers.js";

export function primaryFraudCheckRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a primary fraud check rollup code in its canonical PFCR- form. */
export function normalizePrimaryFraudCheckRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFCR-")) return clean;
  return `PFCR-${clean.replaceAll(" ", "-")}`;
}

export function primaryFraudCheckRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
