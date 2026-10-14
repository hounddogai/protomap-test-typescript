import { batchedStreakExceptionBucket } from "../../streak/streak-exception/batched-streak-exception-policy.js";
import { StreakSlot } from "../../streak/streak-exception/streak-slot.js";
import { RedemptionPreference, newRedemptionPreference } from "./redemption-preference.js";

export function summarizeStreakSlotsForPreference(items: StreakSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRedemptionPreferencesFromSlot(items: StreakSlot[]): RedemptionPreference[] {
  const out: RedemptionPreference[] = [];
  for (const item of items) {
    const derived = newRedemptionPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyRedemptionPreferenceExtra(item: RedemptionPreference): string {
  return batchedStreakExceptionBucket(item.netTotal());
}
