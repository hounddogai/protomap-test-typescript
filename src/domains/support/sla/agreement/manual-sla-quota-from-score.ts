import { AdaptiveDeflectionScore } from "../../deflection/manifest/adaptive-deflection-score.js";
import { adaptiveDeflectionWindowBucket } from "../../deflection/manifest/adaptive-deflection-window-policy.js";
import { ManualSlaQuota, newManualSlaQuota } from "./manual-sla-quota.js";

export function summarizeAdaptiveDeflectionScoresForQuota(items: AdaptiveDeflectionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveManualSlaQuotasFromScore(items: AdaptiveDeflectionScore[]): ManualSlaQuota[] {
  const out: ManualSlaQuota[] = [];
  for (const item of items) {
    const derived = newManualSlaQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualSlaQuota(item: ManualSlaQuota): string {
  return adaptiveDeflectionWindowBucket(item.effectiveExposure());
}
