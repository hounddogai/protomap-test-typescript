import * as retry from "../../../../kit/retry.js";

export function adaptiveTicketViewAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a adaptive ticket view assignment score falls in. */
export function classifyAdaptiveTicketViewAssignment(score: number): string {
  if (score < 45.3) return "low";
  if (score < 95.8) return "high";
  return "ok";
}

/** Puts a adaptive ticket view assignment code in its canonical ATVA- form. */
export function normalizeAdaptiveTicketViewAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ATVA-")) return clean;
  return `ATVA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveTicketViewAssignment(): number {
  const policy = retry.defaultPolicy("adaptive-ticket-view-assignment");
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
