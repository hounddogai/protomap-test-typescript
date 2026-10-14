import { TieredTouchpointSummary } from "../../touchpoint/milestone/tiered-touchpoint-summary.js";
import { touchpointMilestoneBucket } from "../../touchpoint/milestone/touchpoint-milestone-policy.js";
import { PathClaim, newPathClaim } from "./path-claim.js";

export function summarizeTieredTouchpointSummariesForClaim(items: TieredTouchpointSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePathClaimsFromSummary(items: TieredTouchpointSummary[]): PathClaim[] {
  const out: PathClaim[] = [];
  for (const item of items) {
    const derived = newPathClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePathClaim(item: PathClaim): string {
  return touchpointMilestoneBucket(item.netVolume());
}
