import * as numbers from "../../../../kit/numbers.js";

export function optOutRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a opt out rule code in its canonical OOR- form. */
export function normalizeOptOutRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOR-")) return clean;
  return `OOR-${clean.replaceAll(" ", "-")}`;
}

export function optOutRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
