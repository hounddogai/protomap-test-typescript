import { scheduledWaitRequestBucket } from "../../wait/request/scheduled-wait-request-policy.js";
import { ScheduledWaitRequest } from "../../wait/request/scheduled-wait-request.js";
import { JourneyQuota, newJourneyQuota } from "./journey-quota.js";

export function summarizeScheduledWaitRequestsForQuota(items: ScheduledWaitRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveJourneyQuotasFromRequest(items: ScheduledWaitRequest[]): JourneyQuota[] {
  const out: JourneyQuota[] = [];
  for (const item of items) {
    const derived = newJourneyQuota(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignJourneyQuota(item: JourneyQuota): string {
  return scheduledWaitRequestBucket(item.weightedLoad());
}
