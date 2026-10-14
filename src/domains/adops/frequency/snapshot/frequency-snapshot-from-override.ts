import { normalizeCappedBidRuleOverrideCode } from "../../bid-rule/rule-notice/capped-bid-rule-override-policy.js";
import { CappedBidRuleOverride } from "../../bid-rule/rule-notice/capped-bid-rule-override.js";
import { FrequencySnapshot, newFrequencySnapshot } from "./frequency-snapshot.js";

export function summarizeCappedBidRuleOverridesForSnapshot(items: CappedBidRuleOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveFrequencySnapshotsFromOverride(items: CappedBidRuleOverride[]): FrequencySnapshot[] {
  const out: FrequencySnapshot[] = [];
  for (const item of items) {
    const derived = newFrequencySnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeFrequencySnapshot(item: FrequencySnapshot): string {
  return normalizeCappedBidRuleOverrideCode(item.code);
}
