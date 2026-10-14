import { PathAgreement } from "../../path/baseline/path-agreement.js";
import { pathBundleWeight } from "../../path/baseline/path-bundle-policy.js";
import { GlobalTouchpointNotice, newGlobalTouchpointNotice } from "./global-touchpoint-notice.js";

export function summarizePathAgreementsForNotice(items: PathAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalTouchpointNoticesFromAgreement(items: PathAgreement[]): GlobalTouchpointNotice[] {
  const out: GlobalTouchpointNotice[] = [];
  for (const item of items) {
    const derived = newGlobalTouchpointNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planGlobalTouchpointNotice(item: GlobalTouchpointNotice): number {
  return pathBundleWeight(2, true);
}
