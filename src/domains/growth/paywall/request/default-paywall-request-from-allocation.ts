import { normalizeRetentionAgreementCode } from "../../retention/allocation/retention-agreement-policy.js";
import { RetentionAllocation } from "../../retention/allocation/retention-allocation.js";
import { DefaultPaywallRequest, newDefaultPaywallRequest } from "./default-paywall-request.js";

export function summarizeRetentionAllocationsForRequest(items: RetentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveDefaultPaywallRequestsFromAllocation(items: RetentionAllocation[]): DefaultPaywallRequest[] {
  const out: DefaultPaywallRequest[] = [];
  for (const item of items) {
    const derived = newDefaultPaywallRequest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeDefaultPaywallRequest(item: DefaultPaywallRequest): string {
  return normalizeRetentionAgreementCode(item.code);
}
