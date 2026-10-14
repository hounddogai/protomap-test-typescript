import { classifyLenientPacingForecast } from "../../pacing/pacing-forecast/lenient-pacing-forecast-policy.js";
import { PendingPacingTemplate } from "../../pacing/pacing-forecast/pending-pacing-template.js";
import { GlobalPlacementAdjustment, newGlobalPlacementAdjustment } from "./global-placement-adjustment.js";

export function summarizePendingPacingTemplatesForAdjustment(items: PendingPacingTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveGlobalPlacementAdjustmentsFromTemplate(items: PendingPacingTemplate[]): GlobalPlacementAdjustment[] {
  const out: GlobalPlacementAdjustment[] = [];
  for (const item of items) {
    const derived = newGlobalPlacementAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalPlacementAdjustment(item: GlobalPlacementAdjustment): string {
  return classifyLenientPacingForecast(item.weightedTotal());
}
