import * as retry from "../../../../kit/retry.js";

/** Puts a lenient ticket view review code in its canonical LTVR- form. */
export function normalizeLenientTicketViewReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LTVR-")) return clean;
  return `LTVR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientTicketViewReview(): number {
  const policy = retry.defaultPolicy("lenient-ticket-view-review");
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
