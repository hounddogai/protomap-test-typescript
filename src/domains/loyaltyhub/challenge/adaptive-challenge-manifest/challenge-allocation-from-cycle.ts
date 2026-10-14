import { badgeCycleBucket } from "../../badge/cycle/badge-cycle-policy.js";
import { BadgeCycle } from "../../badge/cycle/badge-cycle.js";
import { ChallengeAllocation, newChallengeAllocation } from "./challenge-allocation.js";

export function summarizeBadgeCyclesForAllocation(items: BadgeCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveChallengeAllocationsFromCycle(items: BadgeCycle[]): ChallengeAllocation[] {
  const out: ChallengeAllocation[] = [];
  for (const item of items) {
    const derived = newChallengeAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateChallengeAllocation(item: ChallengeAllocation): string {
  return badgeCycleBucket(item.adjustedValue());
}
