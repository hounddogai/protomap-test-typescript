import { ManualTicketViewClaim } from "../../ticket-view/audit/manual-ticket-view-claim.js";
import { ticketViewAuditWeight } from "../../ticket-view/audit/ticket-view-audit-policy.js";
import { WeightedCsatRule, newWeightedCsatRule } from "./weighted-csat-rule.js";

export function summarizeManualTicketViewClaimsForRule(items: ManualTicketViewClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveWeightedCsatRulesFromClaim(items: ManualTicketViewClaim[]): WeightedCsatRule[] {
  const out: WeightedCsatRule[] = [];
  for (const item of items) {
    const derived = newWeightedCsatRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyWeightedCsatRule(item: WeightedCsatRule): number {
  return ticketViewAuditWeight(8, true);
}
