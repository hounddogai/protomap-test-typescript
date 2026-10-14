import { normalizeSeasonalInviteRequestCode } from "../../invite/preference/seasonal-invite-request-policy.js";
import { SeasonalInviteRequest } from "../../invite/preference/seasonal-invite-request.js";
import { ScheduledPayoutScore, newScheduledPayoutScore } from "./scheduled-payout-score.js";

export function summarizeSeasonalInviteRequestsForScore(items: SeasonalInviteRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveScheduledPayoutScoresFromRequest(items: SeasonalInviteRequest[]): ScheduledPayoutScore[] {
  const out: ScheduledPayoutScore[] = [];
  for (const item of items) {
    const derived = newScheduledPayoutScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignScheduledPayoutScore(item: ScheduledPayoutScore): string {
  return normalizeSeasonalInviteRequestCode(item.code);
}
