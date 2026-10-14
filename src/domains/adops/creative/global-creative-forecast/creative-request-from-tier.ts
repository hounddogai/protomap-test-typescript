import { classifyPlacementAssignment } from "../../placement/assignment/placement-assignment-policy.js";
import { PlacementTier } from "../../placement/assignment/placement-tier.js";
import { CreativeRequest, newCreativeRequest } from "./creative-request.js";

export function summarizePlacementTiersForRequest(items: PlacementTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCreativeRequestsFromTier(items: PlacementTier[]): CreativeRequest[] {
  const out: CreativeRequest[] = [];
  for (const item of items) {
    const derived = newCreativeRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveCreativeRequest(item: CreativeRequest): string {
  return classifyPlacementAssignment(item.measuredValue());
}
