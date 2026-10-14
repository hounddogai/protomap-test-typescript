import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalChallengeCycle(): number {
  const policy = retry.defaultPolicy("global-challenge-cycle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a global challenge cycle score falls in. */
export function classifyGlobalChallengeCycle(score: number): string {
  if (score < 12.1) return "high";
  if (score < 27.4) return "low";
  if (score < 76.6) return "watch";
  if (score < 86) return "ok";
  return "elevated";
}

/** Puts a global challenge cycle code in its canonical GCC- form. */
export function normalizeGlobalChallengeCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCC-")) return clean;
  return `GCC-${clean.replaceAll(" ", "-")}`;
}

export function globalChallengeCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
