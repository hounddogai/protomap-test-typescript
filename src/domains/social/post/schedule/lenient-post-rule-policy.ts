import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient post rule score falls in. */
export function classifyLenientPostRule(score: number): string {
  if (score < 73) return "ok";
  if (score < 93.5) return "elevated";
  if (score < 95.4) return "critical";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientPostRule(): number {
  const policy = retry.defaultPolicy("lenient-post-rule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a lenient post rule code in its canonical LPR- form. */
export function normalizeLenientPostRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPR-")) return clean;
  return `LPR-${clean.replaceAll(" ", "-")}`;
}
