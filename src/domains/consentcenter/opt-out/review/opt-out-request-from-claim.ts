import { suppressionClaimBucket } from "../../suppression/suppression-slot/suppression-claim-policy.js";
import { SuppressionClaim } from "../../suppression/suppression-slot/suppression-claim.js";
import { OptOutRequest, newOptOutRequest } from "./opt-out-request.js";

export function summarizeSuppressionClaimsForRequest(items: SuppressionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveOptOutRequestsFromClaim(items: SuppressionClaim[]): OptOutRequest[] {
  const out: OptOutRequest[] = [];
  for (const item of items) {
    const derived = newOptOutRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyOptOutRequest(item: OptOutRequest): string {
  return suppressionClaimBucket(item.adjustedValue());
}
