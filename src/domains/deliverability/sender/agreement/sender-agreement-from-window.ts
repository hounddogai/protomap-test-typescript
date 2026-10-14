import { bounceExceptionWeight } from "../../bounce/window/bounce-exception-policy.js";
import { BounceWindow } from "../../bounce/window/bounce-window.js";
import { SenderAgreement, newSenderAgreement } from "./sender-agreement.js";

export function summarizeBounceWindowsForAgreement(items: BounceWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSenderAgreementsFromWindow(items: BounceWindow[]): SenderAgreement[] {
  const out: SenderAgreement[] = [];
  for (const item of items) {
    const derived = newSenderAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeSenderAgreement(item: SenderAgreement): number {
  return bounceExceptionWeight(4, true);
}
