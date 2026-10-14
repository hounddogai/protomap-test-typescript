import { lenientPaywallEntryWeight } from "../../paywall/pending-paywall-metric/lenient-paywall-entry-policy.js";
import { LenientPaywallEntry } from "../../paywall/pending-paywall-metric/lenient-paywall-entry.js";
import { RollingNudgeCheckpoint, newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

export function summarizeLenientPaywallEntriesForCheckpoint(items: LenientPaywallEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRollingNudgeCheckpointsFromEntry(items: LenientPaywallEntry[]): RollingNudgeCheckpoint[] {
  const out: RollingNudgeCheckpoint[] = [];
  for (const item of items) {
    const derived = newRollingNudgeCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingNudgeCheckpoint(item: RollingNudgeCheckpoint): number {
  return lenientPaywallEntryWeight(1, true);
}
