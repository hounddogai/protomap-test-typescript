import { legacyModelDraftWeight } from "../../model/model-draft/legacy-model-draft-policy.js";
import { RegionalModelGroup } from "../../model/model-draft/regional-model-group.js";
import { ScheduledPathEstimate, newScheduledPathEstimate } from "./scheduled-path-estimate.js";

export function summarizeRegionalModelGroupsForEstimate(items: RegionalModelGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveScheduledPathEstimatesFromGroup(items: RegionalModelGroup[]): ScheduledPathEstimate[] {
  const out: ScheduledPathEstimate[] = [];
  for (const item of items) {
    const derived = newScheduledPathEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeScheduledPathEstimate(item: ScheduledPathEstimate): number {
  return legacyModelDraftWeight(2, true);
}
