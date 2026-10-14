import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingBaseline(): number {
  const policy = retry.defaultPolicy("pacing-baseline");
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

/** Names the band a pacing baseline score falls in. */
export function classifyPacingBaseline(score: number): string {
  if (score < 11.6) return "ok";
  if (score < 16.6) return "low";
  if (score < 83.6) return "medium";
  return "high";
}

/** Puts a pacing baseline code in its canonical PB- form. */
export function normalizePacingBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}

export function pacingBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
