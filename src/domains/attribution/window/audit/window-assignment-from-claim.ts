import {
  normalizeRollingConversionClaimCode,
} from "../../conversion/conversion-group/rolling-conversion-claim-policy.js";
import { RollingConversionClaim } from "../../conversion/conversion-group/rolling-conversion-claim.js";
import { WindowAssignment, newWindowAssignment } from "./window-assignment.js";

export function summarizeRollingConversionClaimsForAssignment(items: RollingConversionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWindowAssignmentsFromClaim(items: RollingConversionClaim[]): WindowAssignment[] {
  const out: WindowAssignment[] = [];
  for (const item of items) {
    const derived = newWindowAssignment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveWindowAssignment(item: WindowAssignment): string {
  return normalizeRollingConversionClaimCode(item.code);
}
