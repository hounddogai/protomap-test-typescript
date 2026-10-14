import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 89336.0, in order. */
export function escalationManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89336) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function escalationManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a escalation manifest code in its canonical EM- form. */
export function normalizeEscalationManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EM-")) return clean;
  return `EM-${clean.replaceAll(" ", "-")}`;
}
