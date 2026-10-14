import { weightedWindowDraftWeight } from "../../window/notice/weighted-window-draft-policy.js";
import { WindowNotice } from "../../window/notice/window-notice.js";
import { DefaultCreditOverride, newDefaultCreditOverride } from "./default-credit-override.js";

export function summarizeWindowNoticesForOverride(items: WindowNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDefaultCreditOverridesFromNotice(items: WindowNotice[]): DefaultCreditOverride[] {
  const out: DefaultCreditOverride[] = [];
  for (const item of items) {
    const derived = newDefaultCreditOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDefaultCreditOverride(item: DefaultCreditOverride): number {
  return weightedWindowDraftWeight(3, true);
}
