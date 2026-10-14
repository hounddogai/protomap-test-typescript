import { normalizeInsightGroupCode } from "../../insight/segment/insight-group-policy.js";
import { LegacyInsightSegment } from "../../insight/segment/legacy-insight-segment.js";
import { WeightedQueueRule, newWeightedQueueRule } from "./weighted-queue-rule.js";

export function summarizeLegacyInsightSegmentsForRule(items: LegacyInsightSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWeightedQueueRulesFromSegment(items: LegacyInsightSegment[]): WeightedQueueRule[] {
  const out: WeightedQueueRule[] = [];
  for (const item of items) {
    const derived = newWeightedQueueRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWeightedQueueRule(item: WeightedQueueRule): string {
  return normalizeInsightGroupCode(item.code);
}
