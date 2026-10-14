import { lenientSenderSegmentWeight } from "../../sender/sender-segment/lenient-sender-segment-policy.js";
import { ManualSenderScore } from "../../sender/sender-segment/manual-sender-score.js";
import { BounceRollup, newBounceRollup } from "./bounce-rollup.js";

export function summarizeManualSenderScoresForRollup(items: ManualSenderScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBounceRollupsFromScore(items: ManualSenderScore[]): BounceRollup[] {
  const out: BounceRollup[] = [];
  for (const item of items) {
    const derived = newBounceRollup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeBounceRollup(item: BounceRollup): number {
  return lenientSenderSegmentWeight(5, true);
}
