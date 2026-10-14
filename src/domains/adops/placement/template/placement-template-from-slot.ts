import { LegacyPlacementSlot } from "../plan/legacy-placement-slot.js";
import { placementPreferenceBucket } from "../plan/placement-preference-policy.js";
import { PlacementTemplate, newPlacementTemplate } from "./placement-template.js";

export function summarizeLegacyPlacementSlotsForTemplate(items: LegacyPlacementSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePlacementTemplatesFromSlot(items: LegacyPlacementSlot[]): PlacementTemplate[] {
  const out: PlacementTemplate[] = [];
  for (const item of items) {
    const derived = newPlacementTemplate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPlacementTemplate(item: PlacementTemplate): string {
  return placementPreferenceBucket(item.projectedLoad());
}
