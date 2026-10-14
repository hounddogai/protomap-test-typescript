import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a retention quota code in its canonical RQ- form. */
export function normalizeRetentionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQ-")) return clean;
  return `RQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a retention quota score falls in. */
export function classifyRetentionQuota(score: number): string {
  if (score < 32.2) return "low";
  if (score < 47.1) return "high";
  if (score < 51.4) return "watch";
  if (score < 92.8) return "minimal";
  return "ok";
}

export function retentionQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionQuota(): number {
  const policy = retry.defaultPolicy("retention-quota");
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
