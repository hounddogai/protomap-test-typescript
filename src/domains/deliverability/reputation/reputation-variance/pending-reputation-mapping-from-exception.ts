import { normalizeComplaintProfileCode } from "../../complaint/profile/complaint-profile-policy.js";
import { FallbackComplaintException } from "../../complaint/profile/fallback-complaint-exception.js";
import { PendingReputationMapping, newPendingReputationMapping } from "./pending-reputation-mapping.js";

export function summarizeFallbackComplaintExceptionsForMapping(items: FallbackComplaintException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePendingReputationMappingsFromException(items: FallbackComplaintException[]): PendingReputationMapping[] {
  const out: PendingReputationMapping[] = [];
  for (const item of items) {
    const derived = newPendingReputationMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPendingReputationMapping(item: PendingReputationMapping): string {
  return normalizeComplaintProfileCode(item.code);
}
