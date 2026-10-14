import { fallbackInsightGroupBucket } from "../group/fallback-insight-group-policy.js";
import { ScheduledInsightTemplate } from "../group/scheduled-insight-template.js";
import { ManualInsightOverride, newManualInsightOverride } from "./manual-insight-override.js";

export function summarizeScheduledInsightTemplatesForOverride(items: ScheduledInsightTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveManualInsightOverridesFromTemplate(items: ScheduledInsightTemplate[]): ManualInsightOverride[] {
  const out: ManualInsightOverride[] = [];
  for (const item of items) {
    const derived = newManualInsightOverride(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyManualInsightOverride(item: ManualInsightOverride): string {
  return fallbackInsightGroupBucket(item.adjustedValue());
}
