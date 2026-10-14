import { funnelSlotWeight } from "../../funnel/manifest/funnel-slot-policy.js";
import { FunnelSlot } from "../../funnel/manifest/funnel-slot.js";
import { CohortBaseline, newCohortBaseline } from "./cohort-baseline.js";

export function summarizeFunnelSlotsForBaseline(items: FunnelSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCohortBaselinesFromSlot(items: FunnelSlot[]): CohortBaseline[] {
  const out: CohortBaseline[] = [];
  for (const item of items) {
    const derived = newCohortBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCohortBaseline(item: CohortBaseline): number {
  return funnelSlotWeight(5, true);
}
