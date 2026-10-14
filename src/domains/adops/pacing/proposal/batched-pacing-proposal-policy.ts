import * as retry from "../../../../kit/retry.js";

/** Puts a batched pacing proposal code in its canonical BPP- form. */
export function normalizeBatchedPacingProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPP-")) return clean;
  return `BPP-${clean.replaceAll(" ", "-")}`;
}

export function batchedPacingProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedPacingProposal(): number {
  const policy = retry.defaultPolicy("batched-pacing-proposal");
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
