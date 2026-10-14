import { defaultProofBatchBucket } from "../../proof/quota/default-proof-batch-policy.js";
import { ProofQuota } from "../../proof/quota/proof-quota.js";
import { GlobalOptOutSlot, newGlobalOptOutSlot } from "./global-opt-out-slot.js";

export function summarizeProofQuotasForSlot(items: ProofQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalOptOutSlotsFromQuota(items: ProofQuota[]): GlobalOptOutSlot[] {
  const out: GlobalOptOutSlot[] = [];
  for (const item of items) {
    const derived = newGlobalOptOutSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectGlobalOptOutSlot(item: GlobalOptOutSlot): string {
  return defaultProofBatchBucket(item.netValue());
}
