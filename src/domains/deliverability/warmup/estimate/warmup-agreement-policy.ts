import * as retry from "../../../../kit/retry.js";

/** Names the band a warmup agreement score falls in. */
export function classifyWarmupAgreement(score: number): string {
  if (score < 60.8) return "watch";
  if (score < 64) return "critical";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupAgreement(): number {
  const policy = retry.defaultPolicy("warmup-agreement");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a warmup agreement code in its canonical WA- form. */
export function normalizeWarmupAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WA-")) return clean;
  return `WA-${clean.replaceAll(" ", "-")}`;
}
