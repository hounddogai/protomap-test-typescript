import { PendingPlacementException } from "../../placement/template/pending-placement-exception.js";
import { normalizePlacementTemplateCode } from "../../placement/template/placement-template-policy.js";
import { FrequencyTier, newFrequencyTier } from "./frequency-tier.js";

export function summarizePendingPlacementExceptionsForTier(items: PendingPlacementException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveFrequencyTiersFromException(items: PendingPlacementException[]): FrequencyTier[] {
  const out: FrequencyTier[] = [];
  for (const item of items) {
    const derived = newFrequencyTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFrequencyTier(item: FrequencyTier): string {
  return normalizePlacementTemplateCode(item.code);
}
