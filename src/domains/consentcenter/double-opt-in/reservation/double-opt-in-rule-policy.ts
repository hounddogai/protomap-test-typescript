import * as numbers from "../../../../kit/numbers.js";

/** Puts a double opt in rule code in its canonical DOIR- form. */
export function normalizeDoubleOptInRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIR-")) return clean;
  return `DOIR-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
