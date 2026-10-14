import { bounceBatchBucket } from "../../bounce/reservation/bounce-batch-policy.js";
import { BounceBatch } from "../../bounce/reservation/bounce-batch.js";
import { WeightedDomainBundle, newWeightedDomainBundle } from "./weighted-domain-bundle.js";

export function summarizeBounceBatchesForBundle(items: BounceBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedDomainBundlesFromBatch(items: BounceBatch[]): WeightedDomainBundle[] {
  const out: WeightedDomainBundle[] = [];
  for (const item of items) {
    const derived = newWeightedDomainBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWeightedDomainBundle(item: WeightedDomainBundle): string {
  return bounceBatchBucket(item.measuredValue());
}
