import { MacroBaseline } from "../../macro/baseline/macro-baseline.js";
import { macroScheduleBucket } from "../../macro/baseline/macro-schedule-policy.js";
import { PendingCsatMilestone, newPendingCsatMilestone } from "./pending-csat-milestone.js";

export function summarizeMacroBaselinesForMilestone(items: MacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePendingCsatMilestonesFromBaseline(items: MacroBaseline[]): PendingCsatMilestone[] {
  const out: PendingCsatMilestone[] = [];
  for (const item of items) {
    const derived = newPendingCsatMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePendingCsatMilestone(item: PendingCsatMilestone): string {
  return macroScheduleBucket(item.projectedExposure());
}
