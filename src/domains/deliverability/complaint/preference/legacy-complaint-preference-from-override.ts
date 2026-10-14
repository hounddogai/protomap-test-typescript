import { normalizeBatchedWarmupBatchCode } from "../../warmup/override-item/batched-warmup-batch-policy.js";
import { DefaultWarmupOverride } from "../../warmup/override-item/default-warmup-override.js";
import { LegacyComplaintPreference, newLegacyComplaintPreference } from "./legacy-complaint-preference.js";

export function summarizeDefaultWarmupOverridesForPreference(items: DefaultWarmupOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveLegacyComplaintPreferencesFromOverride(items: DefaultWarmupOverride[]): LegacyComplaintPreference[] {
  const out: LegacyComplaintPreference[] = [];
  for (const item of items) {
    const derived = newLegacyComplaintPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLegacyComplaintPreference(item: LegacyComplaintPreference): string {
  return normalizeBatchedWarmupBatchCode(item.code);
}
