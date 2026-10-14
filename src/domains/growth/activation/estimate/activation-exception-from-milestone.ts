import { DefaultPaywallMilestone } from "../../paywall/budget/default-paywall-milestone.js";
import { regionalPaywallSnapshotBucket } from "../../paywall/budget/regional-paywall-snapshot-policy.js";
import { ActivationException, newActivationException } from "./activation-exception.js";

export function summarizeDefaultPaywallMilestonesForException(items: DefaultPaywallMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveActivationExceptionsFromMilestone(items: DefaultPaywallMilestone[]): ActivationException[] {
  const out: ActivationException[] = [];
  for (const item of items) {
    const derived = newActivationException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchActivationException(item: ActivationException): string {
  return regionalPaywallSnapshotBucket(item.weightedValue());
}
