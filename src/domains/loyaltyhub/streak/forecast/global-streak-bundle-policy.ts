import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalStreakBundle(): number {
  const policy = retry.defaultPolicy("global-streak-bundle");
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

/** Names the band a global streak bundle score falls in. */
export function classifyGlobalStreakBundle(score: number): string {
  if (score < 54.7) return "high";
  if (score < 95.9) return "watch";
  return "low";
}

/** Puts a global streak bundle code in its canonical GSB- form. */
export function normalizeGlobalStreakBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSB-")) return clean;
  return `GSB-${clean.replaceAll(" ", "-")}`;
}
