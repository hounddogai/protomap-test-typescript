import * as retry from "../../../../kit/retry.js";

/** Puts a batched opt out baseline code in its canonical BOOB- form. */
export function normalizeBatchedOptOutBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BOOB-")) return clean;
  return `BOOB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedOptOutBaseline(): number {
  const policy = retry.defaultPolicy("batched-opt-out-baseline");
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

/** Names the band a batched opt out baseline score falls in. */
export function classifyBatchedOptOutBaseline(score: number): string {
  if (score < 4.8) return "medium";
  if (score < 24.7) return "high";
  return "ok";
}
