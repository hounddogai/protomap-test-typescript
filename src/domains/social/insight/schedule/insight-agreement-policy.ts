import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function insightAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a insight agreement score falls in. */
export function classifyInsightAgreement(score: number): string {
  if (score < 58.3) return "critical";
  if (score < 85.2) return "ok";
  return "watch";
}

/** Puts a insight agreement code in its canonical IA- form. */
export function normalizeInsightAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IA-")) return clean;
  return `IA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightAgreement(): number {
  const policy = retry.defaultPolicy("insight-agreement");
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
