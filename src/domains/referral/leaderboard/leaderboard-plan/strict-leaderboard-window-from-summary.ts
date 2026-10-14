import { normalizeAdaptiveInviteSummaryCode } from "../../invite/ledger/adaptive-invite-summary-policy.js";
import { AdaptiveInviteSummary } from "../../invite/ledger/adaptive-invite-summary.js";
import { StrictLeaderboardWindow, newStrictLeaderboardWindow } from "./strict-leaderboard-window.js";

export function summarizeAdaptiveInviteSummariesForWindow(items: AdaptiveInviteSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStrictLeaderboardWindowsFromSummary(items: AdaptiveInviteSummary[]): StrictLeaderboardWindow[] {
  const out: StrictLeaderboardWindow[] = [];
  for (const item of items) {
    const derived = newStrictLeaderboardWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStrictLeaderboardWindow(item: StrictLeaderboardWindow): string {
  return normalizeAdaptiveInviteSummaryCode(item.code);
}
