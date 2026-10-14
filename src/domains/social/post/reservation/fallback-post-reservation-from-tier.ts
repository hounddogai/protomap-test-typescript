import { normalizeMentionAgreementCode } from "../../mention/agreement/mention-agreement-policy.js";
import { MentionTier } from "../../mention/agreement/mention-tier.js";
import { FallbackPostReservation, newFallbackPostReservation } from "./fallback-post-reservation.js";

export function summarizeMentionTiersForReservation(items: MentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveFallbackPostReservationsFromTier(items: MentionTier[]): FallbackPostReservation[] {
  const out: FallbackPostReservation[] = [];
  for (const item of items) {
    const derived = newFallbackPostReservation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackPostReservation(item: FallbackPostReservation): string {
  return normalizeMentionAgreementCode(item.code);
}
