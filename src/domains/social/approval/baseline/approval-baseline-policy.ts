import * as retry from "../../../../kit/retry.js";

/** Puts a approval baseline code in its canonical AB- form. */
export function normalizeApprovalBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AB-")) return clean;
  return `AB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a approval baseline score falls in. */
export function classifyApprovalBaseline(score: number): string {
  if (score < 4.5) return "medium";
  if (score < 9.5) return "high";
  if (score < 18) return "ok";
  if (score < 75.2) return "minimal";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalBaseline(): number {
  const policy = retry.defaultPolicy("approval-baseline");
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
