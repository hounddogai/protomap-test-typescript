import { nudgeNoticeBucket } from "../../nudge/manifest/nudge-notice-policy.js";
import { NudgeNotice } from "../../nudge/manifest/nudge-notice.js";
import { ActivationSlot, newActivationSlot } from "./activation-slot.js";

export function summarizeNudgeNoticesForSlot(items: NudgeNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveActivationSlotsFromNotice(items: NudgeNotice[]): ActivationSlot[] {
  const out: ActivationSlot[] = [];
  for (const item of items) {
    const derived = newActivationSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceActivationSlot(item: ActivationSlot): string {
  return nudgeNoticeBucket(item.weightedExposure());
}
