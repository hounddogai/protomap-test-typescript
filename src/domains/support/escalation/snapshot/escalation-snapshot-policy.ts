import * as numbers from "../../../../kit/numbers.js";

export function escalationSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a escalation snapshot code in its canonical ES- form. */
export function normalizeEscalationSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ES-")) return clean;
  return `ES-${clean.replaceAll(" ", "-")}`;
}
