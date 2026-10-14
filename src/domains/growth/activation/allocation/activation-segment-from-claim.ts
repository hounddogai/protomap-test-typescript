import { batchedFunnelAgreementWeight } from "../../funnel/forecast/batched-funnel-agreement-policy.js";
import { FunnelClaim } from "../../funnel/forecast/funnel-claim.js";
import { ActivationSegment, newActivationSegment } from "./activation-segment.js";

export function summarizeFunnelClaimsForSegment(items: FunnelClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveActivationSegmentsFromClaim(items: FunnelClaim[]): ActivationSegment[] {
  const out: ActivationSegment[] = [];
  for (const item of items) {
    const derived = newActivationSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleActivationSegment(item: ActivationSegment): number {
  return batchedFunnelAgreementWeight(5, true);
}
