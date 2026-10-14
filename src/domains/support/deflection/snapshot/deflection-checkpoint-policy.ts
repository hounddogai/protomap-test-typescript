import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a deflection checkpoint code in its canonical DC- form. */
export function normalizeDeflectionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DC-")) return clean;
  return `DC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a deflection checkpoint score falls in. */
export function classifyDeflectionCheckpoint(score: number): string {
  if (score < 26.6) return "low";
  if (score < 68.3) return "watch";
  return "elevated";
}

export function deflectionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionCheckpoint(): number {
  const policy = retry.defaultPolicy("deflection-checkpoint");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
