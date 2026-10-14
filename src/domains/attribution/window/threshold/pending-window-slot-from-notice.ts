import { normalizeModelNoticeCode } from "../../model/notice/model-notice-policy.js";
import { ModelNotice } from "../../model/notice/model-notice.js";
import { PendingWindowSlot, newPendingWindowSlot } from "./pending-window-slot.js";

export function summarizeModelNoticesForSlot(items: ModelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePendingWindowSlotsFromNotice(items: ModelNotice[]): PendingWindowSlot[] {
  const out: PendingWindowSlot[] = [];
  for (const item of items) {
    const derived = newPendingWindowSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingWindowSlot(item: PendingWindowSlot): string {
  return normalizeModelNoticeCode(item.code);
}
