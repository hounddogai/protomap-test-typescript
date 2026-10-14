import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualTicketViewScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual ticket view schedule code in its canonical MTVS- form. */
export function normalizeManualTicketViewScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTVS-")) return clean;
  return `MTVS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualTicketViewSchedule(): number {
  const policy = retry.defaultPolicy("manual-ticket-view-schedule");
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
