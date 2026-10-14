import * as numbers from "../../../../kit/numbers.js";

export function retentionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a retention checkpoint code in its canonical RC- form. */
export function normalizeRetentionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RC-")) return clean;
  return `RC-${clean.replaceAll(" ", "-")}`;
}
