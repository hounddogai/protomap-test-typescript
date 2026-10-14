import { TouchpointRequest } from "../../touchpoint/request/touchpoint-request.js";
import { classifyTouchpointVariance } from "../../touchpoint/request/touchpoint-variance-policy.js";
import { PathAudit, newPathAudit } from "./path-audit.js";

export function summarizeTouchpointRequestsForAudit(items: TouchpointRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePathAuditsFromRequest(items: TouchpointRequest[]): PathAudit[] {
  const out: PathAudit[] = [];
  for (const item of items) {
    const derived = newPathAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPathAudit(item: PathAudit): string {
  return classifyTouchpointVariance(item.weightedValue());
}
