import { classifySlaAdjustment } from "../../sla/schedule/sla-adjustment-policy.js";
import { SlaAdjustment } from "../../sla/schedule/sla-adjustment.js";
import { TicketViewClaim, newTicketViewClaim } from "./ticket-view-claim.js";

export function summarizeSlaAdjustmentsForClaim(items: SlaAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveTicketViewClaimsFromAdjustment(items: SlaAdjustment[]): TicketViewClaim[] {
  const out: TicketViewClaim[] = [];
  for (const item of items) {
    const derived = newTicketViewClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTicketViewClaim(item: TicketViewClaim): string {
  return classifySlaAdjustment(item.netValue());
}
