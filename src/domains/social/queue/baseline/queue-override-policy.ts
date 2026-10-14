import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 3613.0, in order. */
export function queueOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3613) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queueOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a queue override code in its canonical QO- form. */
export function normalizeQueueOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QO-")) return clean;
  return `QO-${clean.replaceAll(" ", "-")}`;
}
