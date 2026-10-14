import { ComplaintMilestone } from "../../complaint/target/complaint-milestone.js";
import { classifyRollingComplaintTarget } from "../../complaint/target/rolling-complaint-target-policy.js";
import { FallbackSenderRollup, newFallbackSenderRollup } from "./fallback-sender-rollup.js";

export function summarizeComplaintMilestonesForRollup(items: ComplaintMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveFallbackSenderRollupsFromMilestone(items: ComplaintMilestone[]): FallbackSenderRollup[] {
  const out: FallbackSenderRollup[] = [];
  for (const item of items) {
    const derived = newFallbackSenderRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackSenderRollup(item: FallbackSenderRollup): string {
  return classifyRollingComplaintTarget(item.adjustedExposure());
}
