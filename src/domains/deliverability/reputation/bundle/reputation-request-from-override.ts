import { tieredComplaintOverrideWeight } from "../../complaint/entry/tiered-complaint-override-policy.js";
import { TieredComplaintOverride } from "../../complaint/entry/tiered-complaint-override.js";
import { ReputationRequest, newReputationRequest } from "./reputation-request.js";

export function summarizeTieredComplaintOverridesForRequest(items: TieredComplaintOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveReputationRequestsFromOverride(items: TieredComplaintOverride[]): ReputationRequest[] {
  const out: ReputationRequest[] = [];
  for (const item of items) {
    const derived = newReputationRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeReputationRequest(item: ReputationRequest): number {
  return tieredComplaintOverrideWeight(3, true);
}
