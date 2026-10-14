import { classifyGlobalEscalationRecord } from "../budget/global-escalation-record-policy.js";
import { PendingEscalationSchedule } from "../budget/pending-escalation-schedule.js";
import { RollingEscalationSchedule, newRollingEscalationSchedule } from "./rolling-escalation-schedule.js";

export function summarizePendingEscalationSchedulesForSchedule(items: PendingEscalationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingEscalationSchedulesFromSchedule(items: PendingEscalationSchedule[]): RollingEscalationSchedule[] {
  const out: RollingEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newRollingEscalationSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRollingEscalationSchedule(item: RollingEscalationSchedule): string {
  return classifyGlobalEscalationRecord(item.effectiveLoad());
}
