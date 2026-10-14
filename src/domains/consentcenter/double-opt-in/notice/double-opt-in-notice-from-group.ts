import { manualOptOutProfileBucket } from "../../opt-out/plan/manual-opt-out-profile-policy.js";
import { OptOutGroup } from "../../opt-out/plan/opt-out-group.js";
import { DoubleOptInNotice, newDoubleOptInNotice } from "./double-opt-in-notice.js";

export function summarizeOptOutGroupsForNotice(items: OptOutGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDoubleOptInNoticesFromGroup(items: OptOutGroup[]): DoubleOptInNotice[] {
  const out: DoubleOptInNotice[] = [];
  for (const item of items) {
    const derived = newDoubleOptInNotice(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleDoubleOptInNotice(item: DoubleOptInNotice): string {
  return manualOptOutProfileBucket(item.measuredValue());
}
