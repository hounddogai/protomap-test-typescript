import { StrictBranchAdjustment } from "../../branch/adjustment/strict-branch-adjustment.js";
import { normalizeTieredBranchAdjustmentCode } from "../../branch/adjustment/tiered-branch-adjustment-policy.js";
import { LegacyExitRuleSegment, newLegacyExitRuleSegment } from "./legacy-exit-rule-segment.js";

export function summarizeStrictBranchAdjustmentsForSegment(items: StrictBranchAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLegacyExitRuleSegmentsFromAdjustment(items: StrictBranchAdjustment[]): LegacyExitRuleSegment[] {
  const out: LegacyExitRuleSegment[] = [];
  for (const item of items) {
    const derived = newLegacyExitRuleSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyExitRuleSegment(item: LegacyExitRuleSegment): string {
  return normalizeTieredBranchAdjustmentCode(item.code);
}
