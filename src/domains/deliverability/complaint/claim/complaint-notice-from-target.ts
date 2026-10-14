import { rollingComplaintTargetWeight } from "../target/rolling-complaint-target-policy.js";
import { RollingComplaintTarget } from "../target/rolling-complaint-target.js";
import { ComplaintNotice, newComplaintNotice } from "./complaint-notice.js";

export function summarizeRollingComplaintTargetsForNotice(items: RollingComplaintTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveComplaintNoticesFromTarget(items: RollingComplaintTarget[]): ComplaintNotice[] {
  const out: ComplaintNotice[] = [];
  for (const item of items) {
    const derived = newComplaintNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleComplaintNotice(item: ComplaintNotice): number {
  return rollingComplaintTargetWeight(7, true);
}
