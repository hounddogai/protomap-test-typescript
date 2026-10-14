import { classifyAdaptiveWarmupMapping } from "../../warmup/warmup-manifest/adaptive-warmup-mapping-policy.js";
import { AdaptiveWarmupMapping } from "../../warmup/warmup-manifest/adaptive-warmup-mapping.js";
import { RollingComplaintTarget, newRollingComplaintTarget } from "./rolling-complaint-target.js";

export function summarizeAdaptiveWarmupMappingsForTarget(items: AdaptiveWarmupMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingComplaintTargetsFromMapping(items: AdaptiveWarmupMapping[]): RollingComplaintTarget[] {
  const out: RollingComplaintTarget[] = [];
  for (const item of items) {
    const derived = newRollingComplaintTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingComplaintTarget(item: RollingComplaintTarget): string {
  return classifyAdaptiveWarmupMapping(item.weightedExposure());
}
