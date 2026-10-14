import { tieredReplyProfileBucket } from "../../reply/profile/tiered-reply-profile-policy.js";
import { TieredReplyProfile } from "../../reply/profile/tiered-reply-profile.js";
import { RegionalInsightReservation, newRegionalInsightReservation } from "./regional-insight-reservation.js";

export function summarizeTieredReplyProfilesForReservation(items: TieredReplyProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRegionalInsightReservationsFromProfile(items: TieredReplyProfile[]): RegionalInsightReservation[] {
  const out: RegionalInsightReservation[] = [];
  for (const item of items) {
    const derived = newRegionalInsightReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRegionalInsightReservation(item: RegionalInsightReservation): string {
  return tieredReplyProfileBucket(item.effectiveValue());
}
