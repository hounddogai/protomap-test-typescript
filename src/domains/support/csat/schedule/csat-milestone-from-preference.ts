import { TicketViewPreference } from "../../ticket-view/score/ticket-view-preference.js";
import { normalizeTicketViewScoreCode } from "../../ticket-view/score/ticket-view-score-policy.js";
import { CsatMilestone, newCsatMilestone } from "./csat-milestone.js";

export function summarizeTicketViewPreferencesForMilestone(items: TicketViewPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCsatMilestonesFromPreference(items: TicketViewPreference[]): CsatMilestone[] {
  const out: CsatMilestone[] = [];
  for (const item of items) {
    const derived = newCsatMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCsatMilestone(item: CsatMilestone): string {
  return normalizeTicketViewScoreCode(item.code);
}
