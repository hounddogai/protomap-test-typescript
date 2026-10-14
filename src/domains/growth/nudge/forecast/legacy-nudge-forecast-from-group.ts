import { CohortGroup } from "../../cohort/cohort-draft/cohort-group.js";
import { strictCohortDraftWeight } from "../../cohort/cohort-draft/strict-cohort-draft-policy.js";
import { LegacyNudgeForecast, newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

export function summarizeCohortGroupsForForecast(items: CohortGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyNudgeForecastsFromGroup(items: CohortGroup[]): LegacyNudgeForecast[] {
  const out: LegacyNudgeForecast[] = [];
  for (const item of items) {
    const derived = newLegacyNudgeForecast(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileLegacyNudgeForecast(item: LegacyNudgeForecast): number {
  return strictCohortDraftWeight(3, true);
}
