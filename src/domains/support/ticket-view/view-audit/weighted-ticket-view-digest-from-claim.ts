import { normalizeStrictTicketViewManifestCode } from "../claim/strict-ticket-view-manifest-policy.js";
import { TieredTicketViewClaim } from "../claim/tiered-ticket-view-claim.js";
import { WeightedTicketViewDigest, newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

export function summarizeTieredTicketViewClaimsForDigest(items: TieredTicketViewClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedTicketViewDigestsFromClaim(items: TieredTicketViewClaim[]): WeightedTicketViewDigest[] {
  const out: WeightedTicketViewDigest[] = [];
  for (const item of items) {
    const derived = newWeightedTicketViewDigest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveWeightedTicketViewDigest(item: WeightedTicketViewDigest): string {
  return normalizeStrictTicketViewManifestCode(item.code);
}
