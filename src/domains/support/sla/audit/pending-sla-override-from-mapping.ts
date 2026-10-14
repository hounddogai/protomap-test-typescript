import { normalizeLenientCsatCheckpointCode } from "../../csat/milestone/lenient-csat-checkpoint-policy.js";
import { TieredCsatMapping } from "../../csat/milestone/tiered-csat-mapping.js";
import { PendingSlaOverride, newPendingSlaOverride } from "./pending-sla-override.js";

export function summarizeTieredCsatMappingsForOverride(items: TieredCsatMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePendingSlaOverridesFromMapping(items: TieredCsatMapping[]): PendingSlaOverride[] {
  const out: PendingSlaOverride[] = [];
  for (const item of items) {
    const derived = newPendingSlaOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPendingSlaOverrideExtra(item: PendingSlaOverride): string {
  return normalizeLenientCsatCheckpointCode(item.code);
}
