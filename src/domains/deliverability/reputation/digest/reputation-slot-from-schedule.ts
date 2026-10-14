import { classifyAdaptiveDomainSchedule } from "../../domain/domain-schedule/adaptive-domain-schedule-policy.js";
import { AdaptiveDomainSchedule } from "../../domain/domain-schedule/adaptive-domain-schedule.js";
import { ReputationSlot, newReputationSlot } from "./reputation-slot.js";

export function summarizeAdaptiveDomainSchedulesForSlot(items: AdaptiveDomainSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReputationSlotsFromSchedule(items: AdaptiveDomainSchedule[]): ReputationSlot[] {
  const out: ReputationSlot[] = [];
  for (const item of items) {
    const derived = newReputationSlot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeReputationSlot(item: ReputationSlot): string {
  return classifyAdaptiveDomainSchedule(item.effectiveTotal());
}
