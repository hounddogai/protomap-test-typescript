import { classifyPrimarySlaTarget } from "../preference/primary-sla-target-policy.js";
import { RollingSlaThreshold } from "../preference/rolling-sla-threshold.js";
import { RegionalSlaDigest, newRegionalSlaDigest } from "./regional-sla-digest.js";

export function summarizeRollingSlaThresholdsForDigest(items: RollingSlaThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRegionalSlaDigestsFromThreshold(items: RollingSlaThreshold[]): RegionalSlaDigest[] {
  const out: RegionalSlaDigest[] = [];
  for (const item of items) {
    const derived = newRegionalSlaDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRegionalSlaDigest(item: RegionalSlaDigest): string {
  return classifyPrimarySlaTarget(item.weightedExposure());
}
