import { classifyCreditAllocation } from "../../credit/audit/credit-allocation-policy.js";
import { CreditAudit } from "../../credit/audit/credit-audit.js";
import { TouchpointMilestone, newTouchpointMilestone } from "./touchpoint-milestone.js";

export function summarizeCreditAuditsForMilestone(items: CreditAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTouchpointMilestonesFromAudit(items: CreditAudit[]): TouchpointMilestone[] {
  const out: TouchpointMilestone[] = [];
  for (const item of items) {
    const derived = newTouchpointMilestone(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchTouchpointMilestone(item: TouchpointMilestone): string {
  return classifyCreditAllocation(item.weightedValue());
}
