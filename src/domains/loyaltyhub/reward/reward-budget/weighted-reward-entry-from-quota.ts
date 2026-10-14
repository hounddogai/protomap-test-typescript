import { normalizeLevelQuotaCode } from "../../level/quota/level-quota-policy.js";
import { LevelQuota } from "../../level/quota/level-quota.js";
import { WeightedRewardEntry, newWeightedRewardEntry } from "./weighted-reward-entry.js";

export function summarizeLevelQuotasForEntry(items: LevelQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedRewardEntriesFromQuota(items: LevelQuota[]): WeightedRewardEntry[] {
  const out: WeightedRewardEntry[] = [];
  for (const item of items) {
    const derived = newWeightedRewardEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyWeightedRewardEntryExtra(item: WeightedRewardEntry): string {
  return normalizeLevelQuotaCode(item.code);
}
