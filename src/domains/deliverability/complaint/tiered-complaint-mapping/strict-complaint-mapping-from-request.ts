import { normalizeRollingBounceRequestCode } from "../../bounce/bounce-notice/rolling-bounce-request-policy.js";
import { RollingBounceRequest } from "../../bounce/bounce-notice/rolling-bounce-request.js";
import { StrictComplaintMapping, newStrictComplaintMapping } from "./strict-complaint-mapping.js";

export function summarizeRollingBounceRequestsForMapping(items: RollingBounceRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveStrictComplaintMappingsFromRequest(items: RollingBounceRequest[]): StrictComplaintMapping[] {
  const out: StrictComplaintMapping[] = [];
  for (const item of items) {
    const derived = newStrictComplaintMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStrictComplaintMapping(item: StrictComplaintMapping): string {
  return normalizeRollingBounceRequestCode(item.code);
}
