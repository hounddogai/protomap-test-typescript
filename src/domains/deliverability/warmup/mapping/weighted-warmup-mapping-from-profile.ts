import { SenderProfile } from "../../sender/bundle/sender-profile.js";
import { weightedSenderQuotaWeight } from "../../sender/bundle/weighted-sender-quota-policy.js";
import { WeightedWarmupMapping, newWeightedWarmupMapping } from "./weighted-warmup-mapping.js";

export function summarizeSenderProfilesForMapping(items: SenderProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWeightedWarmupMappingsFromProfile(items: SenderProfile[]): WeightedWarmupMapping[] {
  const out: WeightedWarmupMapping[] = [];
  for (const item of items) {
    const derived = newWeightedWarmupMapping(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveWeightedWarmupMapping(item: WeightedWarmupMapping): number {
  return weightedSenderQuotaWeight(2, true);
}
