import * as retry from "../../../../kit/retry.js";

/** Names the band a approval exception score falls in. */
export function classifyApprovalException(score: number): string {
  if (score < 27.7) return "minimal";
  if (score < 29.6) return "ok";
  if (score < 68.6) return "critical";
  if (score < 91.4) return "low";
  return "medium";
}

/** Puts a approval exception code in its canonical AE- form. */
export function normalizeApprovalExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AE-")) return clean;
  return `AE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalException(): number {
  const policy = retry.defaultPolicy("approval-exception");
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

/** Counts how many amounts fit in a budget of 88676.0, in order. */
export function approvalExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88676) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
