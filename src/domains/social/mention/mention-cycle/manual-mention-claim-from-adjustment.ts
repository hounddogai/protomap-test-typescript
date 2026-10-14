import { DefaultInsightAdjustment } from "../../insight/group/default-insight-adjustment.js";
import { normalizeRegionalInsightReservationCode } from "../../insight/group/regional-insight-reservation-policy.js";
import { ManualMentionClaim, newManualMentionClaim } from "./manual-mention-claim.js";

export function summarizeDefaultInsightAdjustmentsForClaim(items: DefaultInsightAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualMentionClaimsFromAdjustment(items: DefaultInsightAdjustment[]): ManualMentionClaim[] {
  const out: ManualMentionClaim[] = [];
  for (const item of items) {
    const derived = newManualMentionClaim(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceManualMentionClaim(item: ManualMentionClaim): string {
  return normalizeRegionalInsightReservationCode(item.code);
}
