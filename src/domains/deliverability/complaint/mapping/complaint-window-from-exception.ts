import { BounceException } from "../../bounce/window/bounce-exception.js";
import { bounceWindowWeight } from "../../bounce/window/bounce-window-policy.js";
import { ComplaintWindow, newComplaintWindow } from "./complaint-window.js";

export function summarizeBounceExceptionsForWindow(items: BounceException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveComplaintWindowsFromException(items: BounceException[]): ComplaintWindow[] {
  const out: ComplaintWindow[] = [];
  for (const item of items) {
    const derived = newComplaintWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeComplaintWindow(item: ComplaintWindow): number {
  return bounceWindowWeight(8, true);
}
