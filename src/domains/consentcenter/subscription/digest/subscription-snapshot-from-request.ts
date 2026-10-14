import { suppressionGroupBucket } from "../../suppression/request/suppression-group-policy.js";
import { SuppressionRequest } from "../../suppression/request/suppression-request.js";
import { SubscriptionSnapshot, newSubscriptionSnapshot } from "./subscription-snapshot.js";

export function summarizeSuppressionRequestsForSnapshot(items: SuppressionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSubscriptionSnapshotsFromRequest(items: SuppressionRequest[]): SubscriptionSnapshot[] {
  const out: SubscriptionSnapshot[] = [];
  for (const item of items) {
    const derived = newSubscriptionSnapshot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeSubscriptionSnapshot(item: SubscriptionSnapshot): string {
  return suppressionGroupBucket(item.weightedLoad());
}
