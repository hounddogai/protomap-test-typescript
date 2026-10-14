import { LegacyOptOutSegment } from "../../opt-out/milestone/legacy-opt-out-segment.js";
import { classifyRollingOptOutMilestone } from "../../opt-out/milestone/rolling-opt-out-milestone-policy.js";
import { LegacySubscriptionMilestone, newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

export function summarizeLegacyOptOutSegmentsForMilestone(items: LegacyOptOutSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLegacySubscriptionMilestonesFromSegment(items: LegacyOptOutSegment[]): LegacySubscriptionMilestone[] {
  const out: LegacySubscriptionMilestone[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreLegacySubscriptionMilestone(item: LegacySubscriptionMilestone): string {
  return classifyRollingOptOutMilestone(item.effectiveLoad());
}
