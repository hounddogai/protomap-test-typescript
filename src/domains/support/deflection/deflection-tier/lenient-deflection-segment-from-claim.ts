import { GlobalTicketViewClaim } from "../../ticket-view/view-audit/global-ticket-view-claim.js";
import { legacyTicketViewAuditBucket } from "../../ticket-view/view-audit/legacy-ticket-view-audit-policy.js";
import { LenientDeflectionSegment, newLenientDeflectionSegment } from "./lenient-deflection-segment.js";

export function summarizeGlobalTicketViewClaimsForSegment(items: GlobalTicketViewClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientDeflectionSegmentsFromClaim(items: GlobalTicketViewClaim[]): LenientDeflectionSegment[] {
  const out: LenientDeflectionSegment[] = [];
  for (const item of items) {
    const derived = newLenientDeflectionSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLenientDeflectionSegment(item: LenientDeflectionSegment): string {
  return legacyTicketViewAuditBucket(item.measuredValue());
}
