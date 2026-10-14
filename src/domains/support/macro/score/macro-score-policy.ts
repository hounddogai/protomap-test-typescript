import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroScore(): number {
  const policy = retry.defaultPolicy("macro-score");
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

/** Names the band a macro score score falls in. */
export function classifyMacroScore(score: number): string {
  if (score < 6.1) return "minimal";
  if (score < 44.6) return "high";
  return "critical";
}

/** Puts a macro score code in its canonical MS- form. */
export function normalizeMacroScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MS-")) return clean;
  return `MS-${clean.replaceAll(" ", "-")}`;
}
