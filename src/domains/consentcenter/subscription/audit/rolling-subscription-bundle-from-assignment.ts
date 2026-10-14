import { DoubleOptInAssignment } from "../../double-opt-in/assignment/double-opt-in-assignment.js";
import {
  regionalDoubleOptInMetricWeight,
} from "../../double-opt-in/assignment/regional-double-opt-in-metric-policy.js";
import { RollingSubscriptionBundle, newRollingSubscriptionBundle } from "./rolling-subscription-bundle.js";

export function summarizeDoubleOptInAssignmentsForBundle(items: DoubleOptInAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRollingSubscriptionBundlesFromAssignment(items: DoubleOptInAssignment[]): RollingSubscriptionBundle[] {
  const out: RollingSubscriptionBundle[] = [];
  for (const item of items) {
    const derived = newRollingSubscriptionBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateRollingSubscriptionBundle(item: RollingSubscriptionBundle): number {
  return regionalDoubleOptInMetricWeight(2, true);
}
