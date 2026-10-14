import {
  classifyPrimaryEscalationEstimate,
} from "../../escalation/regional-escalation-variance/primary-escalation-estimate-policy.js";
import {
  ScheduledEscalationAdjustment,
} from "../../escalation/regional-escalation-variance/scheduled-escalation-adjustment.js";
import { RegionalCsatSlot, newRegionalCsatSlot } from "./regional-csat-slot.js";

export function summarizeScheduledEscalationAdjustmentsForSlot(items: ScheduledEscalationAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalCsatSlotsFromAdjustment(items: ScheduledEscalationAdjustment[]): RegionalCsatSlot[] {
  const out: RegionalCsatSlot[] = [];
  for (const item of items) {
    const derived = newRegionalCsatSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyRegionalCsatSlot(item: RegionalCsatSlot): string {
  return classifyPrimaryEscalationEstimate(item.projectedTotal());
}
