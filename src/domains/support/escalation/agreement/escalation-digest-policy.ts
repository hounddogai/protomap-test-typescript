import * as retry from "../../../../kit/retry.js";

/** Puts a escalation digest code in its canonical ED- form. */
export function normalizeEscalationDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ED-")) return clean;
  return `ED-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a escalation digest score falls in. */
export function classifyEscalationDigest(score: number): string {
  if (score < 34.6) return "elevated";
  if (score < 39.7) return "watch";
  if (score < 65.6) return "minimal";
  if (score < 85.3) return "low";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationDigest(): number {
  const policy = retry.defaultPolicy("escalation-digest");
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
