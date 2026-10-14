import {
  normalizeChallengeAllocationCode,
} from "../../challenge/adaptive-challenge-manifest/challenge-allocation-policy.js";
import { ChallengeAllocation } from "../../challenge/adaptive-challenge-manifest/challenge-allocation.js";
import { PrimaryBadgeEntry, newPrimaryBadgeEntry } from "./primary-badge-entry.js";

export function summarizeChallengeAllocationsForEntry(items: ChallengeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePrimaryBadgeEntriesFromAllocation(items: ChallengeAllocation[]): PrimaryBadgeEntry[] {
  const out: PrimaryBadgeEntry[] = [];
  for (const item of items) {
    const derived = newPrimaryBadgeEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryBadgeEntry(item: PrimaryBadgeEntry): string {
  return normalizeChallengeAllocationCode(item.code);
}
