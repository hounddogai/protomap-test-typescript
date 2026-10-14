import { GlobalTouchpointAudit } from "../touchpoint-window/global-touchpoint-audit.js";
import { normalizeTieredTouchpointVarianceCode } from "../touchpoint-window/tiered-touchpoint-variance-policy.js";
import { PrimaryTouchpointAssignment, newPrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

export function summarizeGlobalTouchpointAuditsForAssignment(items: GlobalTouchpointAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryTouchpointAssignmentsFromAudit(items: GlobalTouchpointAudit[]): PrimaryTouchpointAssignment[] {
  const out: PrimaryTouchpointAssignment[] = [];
  for (const item of items) {
    const derived = newPrimaryTouchpointAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryTouchpointAssignment(item: PrimaryTouchpointAssignment): string {
  return normalizeTieredTouchpointVarianceCode(item.code);
}
