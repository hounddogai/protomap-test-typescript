import { LegacyPayoutReservation } from "../../payout/payout-reservation/legacy-payout-reservation.js";
import { normalizeManualPayoutWindowCode } from "../../payout/payout-reservation/manual-payout-window-policy.js";
import { DefaultInviteScore, newDefaultInviteScore } from "./default-invite-score.js";

export function summarizeLegacyPayoutReservationsForScore(items: LegacyPayoutReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultInviteScoresFromReservation(items: LegacyPayoutReservation[]): DefaultInviteScore[] {
  const out: DefaultInviteScore[] = [];
  for (const item of items) {
    const derived = newDefaultInviteScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultInviteScore(item: DefaultInviteScore): string {
  return normalizeManualPayoutWindowCode(item.code);
}
