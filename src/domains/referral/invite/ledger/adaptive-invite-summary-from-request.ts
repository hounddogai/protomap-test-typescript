import { normalizeInviteRequestCode } from "../mapping/invite-request-policy.js";
import { InviteRequest } from "../mapping/invite-request.js";
import { AdaptiveInviteSummary, newAdaptiveInviteSummary } from "./adaptive-invite-summary.js";

export function summarizeInviteRequestsForSummary(items: InviteRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveAdaptiveInviteSummariesFromRequest(items: InviteRequest[]): AdaptiveInviteSummary[] {
  const out: AdaptiveInviteSummary[] = [];
  for (const item of items) {
    const derived = newAdaptiveInviteSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignAdaptiveInviteSummary(item: AdaptiveInviteSummary): string {
  return normalizeInviteRequestCode(item.code);
}
