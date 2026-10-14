import {
  adaptiveCreativeForecastWeight,
} from "../../creative/creative-forecast/adaptive-creative-forecast-policy.js";
import { AdaptiveCreativeForecast } from "../../creative/creative-forecast/adaptive-creative-forecast.js";
import { PlacementDraft, newPlacementDraft } from "./placement-draft.js";

export function summarizeAdaptiveCreativeForecastsForDraft(items: AdaptiveCreativeForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePlacementDraftsFromForecast(items: AdaptiveCreativeForecast[]): PlacementDraft[] {
  const out: PlacementDraft[] = [];
  for (const item of items) {
    const derived = newPlacementDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePlacementDraft(item: PlacementDraft): number {
  return adaptiveCreativeForecastWeight(4, true);
}
