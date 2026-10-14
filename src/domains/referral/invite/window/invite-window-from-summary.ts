import { InviteSummary } from "../batch/invite-summary.js";
import { classifyInviteTarget } from "../batch/invite-target-policy.js";
import { InviteWindow, newInviteWindow } from "./invite-window.js";

export function summarizeInviteSummariesForWindow(items: InviteSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveInviteWindowsFromSummary(items: InviteSummary[]): InviteWindow[] {
  const out: InviteWindow[] = [];
  for (const item of items) {
    const derived = newInviteWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchInviteWindow(item: InviteWindow): string {
  return classifyInviteTarget(item.weightedTotal());
}
