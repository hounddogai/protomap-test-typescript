import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroException(): number {
  const policy = retry.defaultPolicy("macro-exception");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a macro exception score falls in. */
export function classifyMacroException(score: number): string {
  if (score < 14.1) return "elevated";
  if (score < 67.9) return "medium";
  return "critical";
}
