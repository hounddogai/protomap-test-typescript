import { FunnelMapping } from "../../funnel/funnel-request/funnel-mapping.js";
import { lenientFunnelRequestBucket } from "../../funnel/funnel-request/lenient-funnel-request-policy.js";
import { AdaptiveRetentionPreference, newAdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

export function summarizeFunnelMappingsForPreference(items: FunnelMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveAdaptiveRetentionPreferencesFromMapping(items: FunnelMapping[]): AdaptiveRetentionPreference[] {
  const out: AdaptiveRetentionPreference[] = [];
  for (const item of items) {
    const derived = newAdaptiveRetentionPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveRetentionPreference(item: AdaptiveRetentionPreference): string {
  return lenientFunnelRequestBucket(item.projectedValue());
}
