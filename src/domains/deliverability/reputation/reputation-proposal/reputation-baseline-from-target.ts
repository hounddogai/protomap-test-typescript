import { normalizeComplaintMilestoneCode } from "../../complaint/target/complaint-milestone-policy.js";
import { RollingComplaintTarget } from "../../complaint/target/rolling-complaint-target.js";
import { ReputationBaseline, newReputationBaseline } from "./reputation-baseline.js";

export function summarizeRollingComplaintTargetsForBaseline(items: RollingComplaintTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveReputationBaselinesFromTarget(items: RollingComplaintTarget[]): ReputationBaseline[] {
  const out: ReputationBaseline[] = [];
  for (const item of items) {
    const derived = newReputationBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateReputationBaseline(item: ReputationBaseline): string {
  return normalizeComplaintMilestoneCode(item.code);
}
