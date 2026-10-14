import { escalationWindowWeight } from "../manifest/escalation-window-policy.js";
import { TieredEscalationManifest } from "../manifest/tiered-escalation-manifest.js";
import { SeasonalEscalationSchedule, newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

export function summarizeTieredEscalationManifestsForSchedule(items: TieredEscalationManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSeasonalEscalationSchedulesFromManifest(items: TieredEscalationManifest[]): SeasonalEscalationSchedule[] {
  const out: SeasonalEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newSeasonalEscalationSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applySeasonalEscalationSchedule(item: SeasonalEscalationSchedule): number {
  return escalationWindowWeight(6, true);
}
