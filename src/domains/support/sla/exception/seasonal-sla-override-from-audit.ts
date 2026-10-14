import { manualTicketViewClaimBucket } from "../../ticket-view/audit/manual-ticket-view-claim-policy.js";
import { TicketViewAudit } from "../../ticket-view/audit/ticket-view-audit.js";
import { SeasonalSlaOverride, newSeasonalSlaOverride } from "./seasonal-sla-override.js";

export function summarizeTicketViewAuditsForOverride(items: TicketViewAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveSeasonalSlaOverridesFromAudit(items: TicketViewAudit[]): SeasonalSlaOverride[] {
  const out: SeasonalSlaOverride[] = [];
  for (const item of items) {
    const derived = newSeasonalSlaOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalSlaOverride(item: SeasonalSlaOverride): string {
  return manualTicketViewClaimBucket(item.netExposure());
}
