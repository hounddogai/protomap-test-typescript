import * as numbers from "../../../../kit/numbers.js";

export function cappedStreakPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a capped streak policy code in its canonical CSP- form. */
export function normalizeCappedStreakPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSP-")) return clean;
  return `CSP-${clean.replaceAll(" ", "-")}`;
}
