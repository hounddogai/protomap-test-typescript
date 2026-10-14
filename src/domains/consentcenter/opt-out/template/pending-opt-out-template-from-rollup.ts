import { doubleOptInMilestoneBucket } from "../../double-opt-in/milestone/double-opt-in-milestone-policy.js";
import { RegionalDoubleOptInRollup } from "../../double-opt-in/milestone/regional-double-opt-in-rollup.js";
import { PendingOptOutTemplate, newPendingOptOutTemplate } from "./pending-opt-out-template.js";

export function summarizeRegionalDoubleOptInRollupsForTemplate(items: RegionalDoubleOptInRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingOptOutTemplatesFromRollup(items: RegionalDoubleOptInRollup[]): PendingOptOutTemplate[] {
  const out: PendingOptOutTemplate[] = [];
  for (const item of items) {
    const derived = newPendingOptOutTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balancePendingOptOutTemplate(item: PendingOptOutTemplate): string {
  return doubleOptInMilestoneBucket(item.projectedValue());
}
