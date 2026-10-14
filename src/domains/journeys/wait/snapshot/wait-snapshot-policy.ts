import * as numbers from "../../../../kit/numbers.js";

export function waitSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function waitSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a wait snapshot code in its canonical WS- form. */
export function normalizeWaitSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WS-")) return clean;
  return `WS-${clean.replaceAll(" ", "-")}`;
}
