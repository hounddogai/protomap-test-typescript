import * as retry from "../../../../kit/retry.js";

/** Puts a seasonal escalation schedule code in its canonical SES- form. */
export function normalizeSeasonalEscalationScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SES-")) return clean;
  return `SES-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalEscalationSchedule(): number {
  const policy = retry.defaultPolicy("seasonal-escalation-schedule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a seasonal escalation schedule score falls in. */
export function classifySeasonalEscalationSchedule(score: number): string {
  if (score < 40.6) return "low";
  if (score < 44.4) return "medium";
  return "watch";
}
