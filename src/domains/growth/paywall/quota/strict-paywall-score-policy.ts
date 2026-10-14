import * as retry from "../../../../kit/retry.js";

/** Puts a strict paywall score code in its canonical SPS- form. */
export function normalizeStrictPaywallScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPS-")) return clean;
  return `SPS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict paywall score score falls in. */
export function classifyStrictPaywallScore(score: number): string {
  if (score < 12.5) return "watch";
  if (score < 26.3) return "ok";
  if (score < 35.1) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPaywallScore(): number {
  const policy = retry.defaultPolicy("strict-paywall-score");
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
