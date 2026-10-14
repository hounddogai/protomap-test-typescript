import { AdaptiveOptOutRecord } from "../../opt-out/out-quota/adaptive-opt-out-record.js";
import { lenientOptOutScheduleBucket } from "../../opt-out/out-quota/lenient-opt-out-schedule-policy.js";
import { LegacySubscriptionRecord, newLegacySubscriptionRecord } from "./legacy-subscription-record.js";

export function summarizeAdaptiveOptOutRecordsForRecord(items: AdaptiveOptOutRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveLegacySubscriptionRecordsFromRecord(items: AdaptiveOptOutRecord[]): LegacySubscriptionRecord[] {
  const out: LegacySubscriptionRecord[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionRecord(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyLegacySubscriptionRecord(item: LegacySubscriptionRecord): string {
  return lenientOptOutScheduleBucket(item.effectiveExposure());
}
