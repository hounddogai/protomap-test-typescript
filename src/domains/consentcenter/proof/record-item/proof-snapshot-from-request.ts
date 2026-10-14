import {
  classifyLenientSubscriptionRequest,
} from "../../subscription/schedule/lenient-subscription-request-policy.js";
import { LenientSubscriptionRequest } from "../../subscription/schedule/lenient-subscription-request.js";
import { ProofSnapshot, newProofSnapshot } from "./proof-snapshot.js";

export function summarizeLenientSubscriptionRequestsForSnapshot(items: LenientSubscriptionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveProofSnapshotsFromRequest(items: LenientSubscriptionRequest[]): ProofSnapshot[] {
  const out: ProofSnapshot[] = [];
  for (const item of items) {
    const derived = newProofSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planProofSnapshot(item: ProofSnapshot): string {
  return classifyLenientSubscriptionRequest(item.weightedExposure());
}
