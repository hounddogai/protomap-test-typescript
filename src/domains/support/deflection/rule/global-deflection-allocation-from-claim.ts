import { normalizeTicketViewAssignmentCode } from "../../ticket-view/claim/ticket-view-assignment-policy.js";
import { TieredTicketViewClaim } from "../../ticket-view/claim/tiered-ticket-view-claim.js";
import { GlobalDeflectionAllocation, newGlobalDeflectionAllocation } from "./global-deflection-allocation.js";

export function summarizeTieredTicketViewClaimsForAllocation(items: TieredTicketViewClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveGlobalDeflectionAllocationsFromClaim(items: TieredTicketViewClaim[]): GlobalDeflectionAllocation[] {
  const out: GlobalDeflectionAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalDeflectionAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankGlobalDeflectionAllocation(item: GlobalDeflectionAllocation): string {
  return normalizeTicketViewAssignmentCode(item.code);
}
