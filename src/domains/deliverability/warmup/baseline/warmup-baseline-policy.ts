import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupBaseline(): number {
  const policy = retry.defaultPolicy("warmup-baseline");
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

export function warmupBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a warmup baseline score falls in. */
export function classifyWarmupBaseline(score: number): string {
  if (score < 11.8) return "high";
  if (score < 19.1) return "elevated";
  if (score < 22.8) return "watch";
  if (score < 54.3) return "minimal";
  return "medium";
}

/** Puts a warmup baseline code in its canonical WB- form. */
export function normalizeWarmupBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WB-")) return clean;
  return `WB-${clean.replaceAll(" ", "-")}`;
}
