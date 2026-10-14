import { optOutDraftBucket } from "../budget/opt-out-draft-policy.js";
import { OptOutProposal } from "../budget/opt-out-proposal.js";
import { PendingOptOutBaseline, newPendingOptOutBaseline } from "./pending-opt-out-baseline.js";

export function summarizeOptOutProposalsForBaseline(items: OptOutProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePendingOptOutBaselinesFromProposal(items: OptOutProposal[]): PendingOptOutBaseline[] {
  const out: PendingOptOutBaseline[] = [];
  for (const item of items) {
    const derived = newPendingOptOutBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPendingOptOutBaseline(item: PendingOptOutBaseline): string {
  return optOutDraftBucket(item.projectedTotal());
}
