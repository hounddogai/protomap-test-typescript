import * as retry from "../../../../kit/retry.js";

export function domainAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a domain agreement score falls in. */
export function classifyDomainAgreement(score: number): string {
  if (score < 33.6) return "ok";
  if (score < 56.8) return "minimal";
  if (score < 74.3) return "critical";
  return "elevated";
}

/** Puts a domain agreement code in its canonical DA- form. */
export function normalizeDomainAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DA-")) return clean;
  return `DA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDomainAgreement(): number {
  const policy = retry.defaultPolicy("domain-agreement");
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
