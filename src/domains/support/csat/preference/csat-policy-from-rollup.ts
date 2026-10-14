import { ticketViewRollupBucket } from "../../ticket-view/rollup/ticket-view-rollup-policy.js";
import { TicketViewRollup } from "../../ticket-view/rollup/ticket-view-rollup.js";
import { CsatPolicy, newCsatPolicy } from "./csat-policy.js";

export function summarizeTicketViewRollupsForPolicy(items: TicketViewRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveCsatPoliciesFromRollup(items: TicketViewRollup[]): CsatPolicy[] {
  const out: CsatPolicy[] = [];
  for (const item of items) {
    const derived = newCsatPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeCsatPolicy(item: CsatPolicy): string {
  return ticketViewRollupBucket(item.projectedLoad());
}
