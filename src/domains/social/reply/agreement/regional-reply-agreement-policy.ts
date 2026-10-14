import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalReplyAgreement(): number {
  const policy = retry.defaultPolicy("regional-reply-agreement");
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

/** Puts a regional reply agreement code in its canonical RRA- form. */
export function normalizeRegionalReplyAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRA-")) return clean;
  return `RRA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional reply agreement score falls in. */
export function classifyRegionalReplyAgreement(score: number): string {
  if (score < 12.9) return "elevated";
  if (score < 53.9) return "minimal";
  if (score < 64.6) return "high";
  if (score < 98.6) return "medium";
  return "ok";
}
