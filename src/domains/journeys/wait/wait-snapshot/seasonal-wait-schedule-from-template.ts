import { classifyFallbackJourneyTemplate } from "../../journey/journey-template/fallback-journey-template-policy.js";
import { FallbackJourneyTemplate } from "../../journey/journey-template/fallback-journey-template.js";
import { SeasonalWaitSchedule, newSeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

export function summarizeFallbackJourneyTemplatesForSchedule(items: FallbackJourneyTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveSeasonalWaitSchedulesFromTemplate(items: FallbackJourneyTemplate[]): SeasonalWaitSchedule[] {
  const out: SeasonalWaitSchedule[] = [];
  for (const item of items) {
    const derived = newSeasonalWaitSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeSeasonalWaitSchedule(item: SeasonalWaitSchedule): string {
  return classifyFallbackJourneyTemplate(item.effectiveVolume());
}
