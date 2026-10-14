import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackJourneyClaim(): number {
  const policy = retry.defaultPolicy("fallback-journey-claim");
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

/** Puts a fallback journey claim code in its canonical FJC- form. */
export function normalizeFallbackJourneyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FJC-")) return clean;
  return `FJC-${clean.replaceAll(" ", "-")}`;
}
