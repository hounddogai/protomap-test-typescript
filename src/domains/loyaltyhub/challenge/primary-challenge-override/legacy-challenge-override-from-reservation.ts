import { normalizeBadgeAssignmentCode } from "../../badge/ledger/badge-assignment-policy.js";
import { StrictBadgeReservation } from "../../badge/ledger/strict-badge-reservation.js";
import { LegacyChallengeOverride, newLegacyChallengeOverride } from "./legacy-challenge-override.js";

export function summarizeStrictBadgeReservationsForOverride(items: StrictBadgeReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyChallengeOverridesFromReservation(items: StrictBadgeReservation[]): LegacyChallengeOverride[] {
  const out: LegacyChallengeOverride[] = [];
  for (const item of items) {
    const derived = newLegacyChallengeOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLegacyChallengeOverride(item: LegacyChallengeOverride): string {
  return normalizeBadgeAssignmentCode(item.code);
}
