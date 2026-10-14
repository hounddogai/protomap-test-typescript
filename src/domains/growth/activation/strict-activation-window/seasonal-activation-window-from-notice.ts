import { normalizeBatchedFunnelNoticeCode } from "../../funnel/funnel-proposal/batched-funnel-notice-policy.js";
import { BatchedFunnelNotice } from "../../funnel/funnel-proposal/batched-funnel-notice.js";
import { SeasonalActivationWindow, newSeasonalActivationWindow } from "./seasonal-activation-window.js";

export function summarizeBatchedFunnelNoticesForWindow(items: BatchedFunnelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalActivationWindowsFromNotice(items: BatchedFunnelNotice[]): SeasonalActivationWindow[] {
  const out: SeasonalActivationWindow[] = [];
  for (const item of items) {
    const derived = newSeasonalActivationWindow(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSeasonalActivationWindow(item: SeasonalActivationWindow): string {
  return normalizeBatchedFunnelNoticeCode(item.code);
}
