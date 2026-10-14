import { normalizeTieredStepTierCode } from "../../step/segment/tiered-step-tier-policy.js";
import { TieredStepTier } from "../../step/segment/tiered-step-tier.js";
import { JourneyTarget, newJourneyTarget } from "./journey-target.js";

export function summarizeTieredStepTiersForTarget(items: TieredStepTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveJourneyTargetsFromTier(items: TieredStepTier[]): JourneyTarget[] {
  const out: JourneyTarget[] = [];
  for (const item of items) {
    const derived = newJourneyTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateJourneyTarget(item: JourneyTarget): string {
  return normalizeTieredStepTierCode(item.code);
}
