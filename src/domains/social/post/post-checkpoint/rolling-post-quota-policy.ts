import * as numbers from "../../../../kit/numbers.js";

export function rollingPostQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a rolling post quota code in its canonical RPQ- form. */
export function normalizeRollingPostQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPQ-")) return clean;
  return `RPQ-${clean.replaceAll(" ", "-")}`;
}
