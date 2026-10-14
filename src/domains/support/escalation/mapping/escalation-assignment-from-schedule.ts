import { classifySlaAdjustment } from "../../sla/schedule/sla-adjustment-policy.js";
import { SlaSchedule } from "../../sla/schedule/sla-schedule.js";
import { EscalationAssignment, newEscalationAssignment } from "./escalation-assignment.js";

export function summarizeSlaSchedulesForAssignment(items: SlaSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveEscalationAssignmentsFromSchedule(items: SlaSchedule[]): EscalationAssignment[] {
  const out: EscalationAssignment[] = [];
  for (const item of items) {
    const derived = newEscalationAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyEscalationAssignment(item: EscalationAssignment): string {
  return classifySlaAdjustment(item.weightedVolume());
}
