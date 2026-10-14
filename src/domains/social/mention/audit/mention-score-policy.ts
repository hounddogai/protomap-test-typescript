import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 71823.0, in order. */
export function mentionScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71823) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMentionScore(): number {
  const policy = retry.defaultPolicy("mention-score");
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

/** Puts a mention score code in its canonical MS- form. */
export function normalizeMentionScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MS-")) return clean;
  return `MS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a mention score score falls in. */
export function classifyMentionScore(score: number): string {
  if (score < 4.2) return "watch";
  if (score < 10.7) return "medium";
  if (score < 56.1) return "minimal";
  if (score < 65.1) return "critical";
  return "high";
}
