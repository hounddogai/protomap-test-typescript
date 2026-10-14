import { seasonalSlaDigestWeight } from "../../sla/sla-reservation/seasonal-sla-digest-policy.js";
import { SeasonalSlaDigest } from "../../sla/sla-reservation/seasonal-sla-digest.js";
import { ManualTicketViewSchedule, newManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

export function summarizeSeasonalSlaDigestsForSchedule(items: SeasonalSlaDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveManualTicketViewSchedulesFromDigest(items: SeasonalSlaDigest[]): ManualTicketViewSchedule[] {
  const out: ManualTicketViewSchedule[] = [];
  for (const item of items) {
    const derived = newManualTicketViewSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualTicketViewSchedule(item: ManualTicketViewSchedule): number {
  return seasonalSlaDigestWeight(4, true);
}
