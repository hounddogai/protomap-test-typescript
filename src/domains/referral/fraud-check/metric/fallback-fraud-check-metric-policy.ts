import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackFraudCheckMetric(): number {
  const policy = retry.defaultPolicy("fallback-fraud-check-metric");
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

/** Names the band a fallback fraud check metric score falls in. */
export function classifyFallbackFraudCheckMetric(score: number): string {
  if (score < 20.1) return "medium";
  if (score < 31.3) return "elevated";
  if (score < 37.6) return "ok";
  if (score < 80.1) return "critical";
  return "watch";
}

/** Puts a fallback fraud check metric code in its canonical FFCM- form. */
export function normalizeFallbackFraudCheckMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFCM-")) return clean;
  return `FFCM-${clean.replaceAll(" ", "-")}`;
}
