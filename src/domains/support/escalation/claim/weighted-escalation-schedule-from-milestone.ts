import { tieredEscalationReservationBucket } from "../snapshot/tiered-escalation-reservation-policy.js";
import { WeightedEscalationMilestone } from "../snapshot/weighted-escalation-milestone.js";
import { WeightedEscalationSchedule, newWeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

export function summarizeWeightedEscalationMilestonesForSchedule(items: WeightedEscalationMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveWeightedEscalationSchedulesFromMilestone(items: WeightedEscalationMilestone[]): WeightedEscalationSchedule[] {
  const out: WeightedEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWeightedEscalationSchedule(item: WeightedEscalationSchedule): string {
  return tieredEscalationReservationBucket(item.adjustedValue());
}
