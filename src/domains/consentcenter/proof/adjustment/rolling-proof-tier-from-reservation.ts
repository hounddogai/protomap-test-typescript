import { FallbackSuppressionReservation } from "../../suppression/reservation/fallback-suppression-reservation.js";
import { normalizeSuppressionDraftCode } from "../../suppression/reservation/suppression-draft-policy.js";
import { RollingProofTier, newRollingProofTier } from "./rolling-proof-tier.js";

export function summarizeFallbackSuppressionReservationsForTier(items: FallbackSuppressionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRollingProofTiersFromReservation(items: FallbackSuppressionReservation[]): RollingProofTier[] {
  const out: RollingProofTier[] = [];
  for (const item of items) {
    const derived = newRollingProofTier(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRollingProofTier(item: RollingProofTier): string {
  return normalizeSuppressionDraftCode(item.code);
}
