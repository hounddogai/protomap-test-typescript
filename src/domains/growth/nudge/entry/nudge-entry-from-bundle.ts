import { NudgeBundle } from "../nudge-draft/nudge-bundle.js";
import { nudgeMilestoneWeight } from "../nudge-draft/nudge-milestone-policy.js";
import { NudgeEntry, newNudgeEntry } from "./nudge-entry.js";

export function summarizeNudgeBundlesForEntry(items: NudgeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveNudgeEntriesFromBundle(items: NudgeBundle[]): NudgeEntry[] {
  const out: NudgeEntry[] = [];
  for (const item of items) {
    const derived = newNudgeEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveNudgeEntry(item: NudgeEntry): number {
  return nudgeMilestoneWeight(9, true);
}
