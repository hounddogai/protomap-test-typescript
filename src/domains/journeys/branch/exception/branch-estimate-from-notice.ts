import { normalizeJourneyNoticeCode } from "../../journey/summary/journey-notice-policy.js";
import { JourneyNotice } from "../../journey/summary/journey-notice.js";
import { BranchEstimate, newBranchEstimate } from "./branch-estimate.js";

export function summarizeJourneyNoticesForEstimate(items: JourneyNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBranchEstimatesFromNotice(items: JourneyNotice[]): BranchEstimate[] {
  const out: BranchEstimate[] = [];
  for (const item of items) {
    const derived = newBranchEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBranchEstimate(item: BranchEstimate): string {
  return normalizeJourneyNoticeCode(item.code);
}
