import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 97174.0, in order. */
export function adaptiveMacroSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97174) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveMacroSummary(): number {
  const policy = retry.defaultPolicy("adaptive-macro-summary");
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

/** Names the band a adaptive macro summary score falls in. */
export function classifyAdaptiveMacroSummary(score: number): string {
  if (score < 13.4) return "high";
  if (score < 96.7) return "minimal";
  return "elevated";
}

/** Puts a adaptive macro summary code in its canonical AMS- form. */
export function normalizeAdaptiveMacroSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMS-")) return clean;
  return `AMS-${clean.replaceAll(" ", "-")}`;
}
