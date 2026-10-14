import { PaywallAllocation } from "../../paywall/baseline/paywall-allocation.js";
import { classifyPaywallBaseline } from "../../paywall/baseline/paywall-baseline-policy.js";
import { RetentionRequest, newRetentionRequest } from "./retention-request.js";

export function summarizePaywallAllocationsForRequest(items: PaywallAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRetentionRequestsFromAllocation(items: PaywallAllocation[]): RetentionRequest[] {
  const out: RetentionRequest[] = [];
  for (const item of items) {
    const derived = newRetentionRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRetentionRequest(item: RetentionRequest): string {
  return classifyPaywallBaseline(item.effectiveExposure());
}
