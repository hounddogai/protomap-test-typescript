import { classifyJourneyThreshold } from "../threshold/journey-threshold-policy.js";
import { LegacyJourneyMapping } from "../threshold/legacy-journey-mapping.js";
import { JourneyTarget, newJourneyTarget } from "./journey-target.js";

export function summarizeLegacyJourneyMappingsForTarget(items: LegacyJourneyMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveJourneyTargetsFromMapping(items: LegacyJourneyMapping[]): JourneyTarget[] {
  const out: JourneyTarget[] = [];
  for (const item of items) {
    const derived = newJourneyTarget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateJourneyTarget(item: JourneyTarget): string {
  return classifyJourneyThreshold(item.adjustedVolume());
}
