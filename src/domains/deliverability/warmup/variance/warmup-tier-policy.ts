import * as retry from "../../../../kit/retry.js";

export function warmupTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a warmup tier score falls in. */
export function classifyWarmupTier(score: number): string {
  if (score < 8.4) return "minimal";
  if (score < 29.2) return "low";
  if (score < 38.3) return "critical";
  if (score < 38.4) return "ok";
  return "medium";
}

/** Puts a warmup tier code in its canonical WT- form. */
export function normalizeWarmupTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WT-")) return clean;
  return `WT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupTier(): number {
  const policy = retry.defaultPolicy("warmup-tier");
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
