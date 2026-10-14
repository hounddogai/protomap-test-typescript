import { GlobalTouchpointAudit } from "../../touchpoint/touchpoint-window/global-touchpoint-audit.js";
import {
  normalizeTieredTouchpointVarianceCode,
} from "../../touchpoint/touchpoint-window/tiered-touchpoint-variance-policy.js";
import { WeightedCreditMilestone, newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

export function summarizeGlobalTouchpointAuditsForMilestone(items: GlobalTouchpointAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedCreditMilestonesFromAudit(items: GlobalTouchpointAudit[]): WeightedCreditMilestone[] {
  const out: WeightedCreditMilestone[] = [];
  for (const item of items) {
    const derived = newWeightedCreditMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWeightedCreditMilestone(item: WeightedCreditMilestone): string {
  return normalizeTieredTouchpointVarianceCode(item.code);
}
