import * as retry from "../../../../kit/retry.js";

/** Puts a flight exception code in its canonical FE- form. */
export function normalizeFlightExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FE-")) return clean;
  return `FE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a flight exception score falls in. */
export function classifyFlightException(score: number): string {
  if (score < 6.5) return "high";
  if (score < 22.1) return "medium";
  if (score < 44.9) return "minimal";
  if (score < 93.3) return "low";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightException(): number {
  const policy = retry.defaultPolicy("flight-exception");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
