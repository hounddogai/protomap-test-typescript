import { scheduledDeflectionRollupWeight } from "../../deflection/rollup/scheduled-deflection-rollup-policy.js";
import { ScheduledDeflectionRollup } from "../../deflection/rollup/scheduled-deflection-rollup.js";
import {
  ScheduledEscalationAdjustment,
  newScheduledEscalationAdjustment,
} from "./scheduled-escalation-adjustment.js";

export function summarizeScheduledDeflectionRollupsForAdjustment(items: ScheduledDeflectionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveScheduledEscalationAdjustmentsFromRollup(items: ScheduledDeflectionRollup[]): ScheduledEscalationAdjustment[] {
  const out: ScheduledEscalationAdjustment[] = [];
  for (const item of items) {
    const derived = newScheduledEscalationAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateScheduledEscalationAdjustment(item: ScheduledEscalationAdjustment): number {
  return scheduledDeflectionRollupWeight(6, true);
}
