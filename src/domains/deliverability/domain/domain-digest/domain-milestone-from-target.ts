import { adaptiveComplaintGroupBucket } from "../../complaint/complaint-target/adaptive-complaint-group-policy.js";
import { ManualComplaintTarget } from "../../complaint/complaint-target/manual-complaint-target.js";
import { DomainMilestone, newDomainMilestone } from "./domain-milestone.js";

export function summarizeManualComplaintTargetsForMilestone(items: ManualComplaintTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDomainMilestonesFromTarget(items: ManualComplaintTarget[]): DomainMilestone[] {
  const out: DomainMilestone[] = [];
  for (const item of items) {
    const derived = newDomainMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDomainMilestone(item: DomainMilestone): string {
  return adaptiveComplaintGroupBucket(item.netTotal());
}
