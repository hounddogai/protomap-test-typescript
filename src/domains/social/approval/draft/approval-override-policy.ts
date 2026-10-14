import * as numbers from "../../../../kit/numbers.js";

export function approvalOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a approval override code in its canonical AO- form. */
export function normalizeApprovalOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AO-")) return clean;
  return `AO-${clean.replaceAll(" ", "-")}`;
}
