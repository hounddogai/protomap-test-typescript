import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a seasonal wait exception score falls in. */
export function classifySeasonalWaitException(score: number): string {
  if (score < 30.6) return "medium";
  if (score < 78.5) return "low";
  if (score < 81.4) return "critical";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalWaitException(): number {
  const policy = retry.defaultPolicy("seasonal-wait-exception");
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

/** Puts a seasonal wait exception code in its canonical SWE- form. */
export function normalizeSeasonalWaitExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWE-")) return clean;
  return `SWE-${clean.replaceAll(" ", "-")}`;
}

export function seasonalWaitExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
