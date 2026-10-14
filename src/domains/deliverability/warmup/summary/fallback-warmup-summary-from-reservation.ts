import { FallbackReputationReservation } from "../../reputation/slot/fallback-reputation-reservation.js";
import { normalizeManualReputationProposalCode } from "../../reputation/slot/manual-reputation-proposal-policy.js";
import { FallbackWarmupSummary, newFallbackWarmupSummary } from "./fallback-warmup-summary.js";

export function summarizeFallbackReputationReservationsForSummary(items: FallbackReputationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFallbackWarmupSummariesFromReservation(items: FallbackReputationReservation[]): FallbackWarmupSummary[] {
  const out: FallbackWarmupSummary[] = [];
  for (const item of items) {
    const derived = newFallbackWarmupSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackWarmupSummary(item: FallbackWarmupSummary): string {
  return normalizeManualReputationProposalCode(item.code);
}
