import { reputationVarianceBucket } from "../../reputation/variance/reputation-variance-policy.js";
import { RollingReputationSummary } from "../../reputation/variance/rolling-reputation-summary.js";
import { GlobalSenderRequest, newGlobalSenderRequest } from "./global-sender-request.js";

export function summarizeRollingReputationSummariesForRequest(items: RollingReputationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveGlobalSenderRequestsFromSummary(items: RollingReputationSummary[]): GlobalSenderRequest[] {
  const out: GlobalSenderRequest[] = [];
  for (const item of items) {
    const derived = newGlobalSenderRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitGlobalSenderRequest(item: GlobalSenderRequest): string {
  return reputationVarianceBucket(item.adjustedVolume());
}
