import { legacyCsatQuotaBucket } from "../../csat/quota/legacy-csat-quota-policy.js";
import { LegacyCsatQuota } from "../../csat/quota/legacy-csat-quota.js";
import { ScheduledTicketViewScore, newScheduledTicketViewScore } from "./scheduled-ticket-view-score.js";

export function summarizeLegacyCsatQuotasForScore(items: LegacyCsatQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveScheduledTicketViewScoresFromQuota(items: LegacyCsatQuota[]): ScheduledTicketViewScore[] {
  const out: ScheduledTicketViewScore[] = [];
  for (const item of items) {
    const derived = newScheduledTicketViewScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleScheduledTicketViewScore(item: ScheduledTicketViewScore): string {
  return legacyCsatQuotaBucket(item.netVolume());
}
