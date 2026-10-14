import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientFunnelClaim(): number {
  const policy = retry.defaultPolicy("lenient-funnel-claim");
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

/** Names the band a lenient funnel claim score falls in. */
export function classifyLenientFunnelClaim(score: number): string {
  if (score < 58) return "watch";
  if (score < 65.8) return "low";
  return "minimal";
}

/** Puts a lenient funnel claim code in its canonical LFC- form. */
export function normalizeLenientFunnelClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFC-")) return clean;
  return `LFC-${clean.replaceAll(" ", "-")}`;
}
