import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredTouchpointCheckpoint(): number {
  const policy = retry.defaultPolicy("tiered-touchpoint-checkpoint");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function tieredTouchpointCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a tiered touchpoint checkpoint code in its canonical TTC- form. */
export function normalizeTieredTouchpointCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TTC-")) return clean;
  return `TTC-${clean.replaceAll(" ", "-")}`;
}
