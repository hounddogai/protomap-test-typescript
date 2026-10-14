import { classifyCreativeDraft } from "../../creative/draft/creative-draft-policy.js";
import { CreativeDraft } from "../../creative/draft/creative-draft.js";
import { PlacementMetric, newPlacementMetric } from "./placement-metric.js";

export function summarizeCreativeDraftsForMetric(items: CreativeDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePlacementMetricsFromDraft(items: CreativeDraft[]): PlacementMetric[] {
  const out: PlacementMetric[] = [];
  for (const item of items) {
    const derived = newPlacementMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computePlacementMetric(item: PlacementMetric): string {
  return classifyCreativeDraft(item.projectedExposure());
}
