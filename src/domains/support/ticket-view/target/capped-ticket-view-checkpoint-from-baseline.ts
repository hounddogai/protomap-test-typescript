import { adaptiveMacroProfileBucket } from "../../macro/policy/adaptive-macro-profile-policy.js";
import { PendingMacroBaseline } from "../../macro/policy/pending-macro-baseline.js";
import { CappedTicketViewCheckpoint, newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

export function summarizePendingMacroBaselinesForCheckpoint(items: PendingMacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveCappedTicketViewCheckpointsFromBaseline(items: PendingMacroBaseline[]): CappedTicketViewCheckpoint[] {
  const out: CappedTicketViewCheckpoint[] = [];
  for (const item of items) {
    const derived = newCappedTicketViewCheckpoint(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCappedTicketViewCheckpoint(item: CappedTicketViewCheckpoint): string {
  return adaptiveMacroProfileBucket(item.netTotal());
}
