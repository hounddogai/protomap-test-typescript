import { NudgeEntry } from "../../nudge/entry/nudge-entry.js";
import { rollingNudgeProposalBucket } from "../../nudge/entry/rolling-nudge-proposal-policy.js";
import { FallbackActivationSlot, newFallbackActivationSlot } from "./fallback-activation-slot.js";

export function summarizeNudgeEntriesForSlot(items: NudgeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveFallbackActivationSlotsFromEntry(items: NudgeEntry[]): FallbackActivationSlot[] {
  const out: FallbackActivationSlot[] = [];
  for (const item of items) {
    const derived = newFallbackActivationSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackActivationSlot(item: FallbackActivationSlot): string {
  return rollingNudgeProposalBucket(item.effectiveVolume());
}
