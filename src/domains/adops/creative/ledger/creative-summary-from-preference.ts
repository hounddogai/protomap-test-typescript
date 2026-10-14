import { normalizeLegacyPlacementSlotCode } from "../../placement/plan/legacy-placement-slot-policy.js";
import { PlacementPreference } from "../../placement/plan/placement-preference.js";
import { CreativeSummary, newCreativeSummary } from "./creative-summary.js";

export function summarizePlacementPreferencesForSummary(items: PlacementPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveCreativeSummariesFromPreference(items: PlacementPreference[]): CreativeSummary[] {
  const out: CreativeSummary[] = [];
  for (const item of items) {
    const derived = newCreativeSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planCreativeSummary(item: CreativeSummary): string {
  return normalizeLegacyPlacementSlotCode(item.code);
}
