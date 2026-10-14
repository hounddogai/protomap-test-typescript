import { cappedWindowNoticeBucket } from "../../window/window-notice/capped-window-notice-policy.js";
import { CappedWindowNotice } from "../../window/window-notice/capped-window-notice.js";
import { TouchpointAgreement, newTouchpointAgreement } from "./touchpoint-agreement.js";

export function summarizeCappedWindowNoticesForAgreement(items: CappedWindowNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTouchpointAgreementsFromNotice(items: CappedWindowNotice[]): TouchpointAgreement[] {
  const out: TouchpointAgreement[] = [];
  for (const item of items) {
    const derived = newTouchpointAgreement(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeTouchpointAgreement(item: TouchpointAgreement): string {
  return cappedWindowNoticeBucket(item.measuredValue());
}
