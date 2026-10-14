import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled escalation adjustment code in its canonical SEA- form. */
export function normalizeScheduledEscalationAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SEA-")) return clean;
  return `SEA-${clean.replaceAll(" ", "-")}`;
}

export function scheduledEscalationAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
