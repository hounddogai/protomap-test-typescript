import { stepBundleBucket } from "../../step/adjustment/step-bundle-policy.js";
import { StepBundle } from "../../step/adjustment/step-bundle.js";
import { BranchEntry, newBranchEntry } from "./branch-entry.js";

export function summarizeStepBundlesForEntry(items: StepBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBranchEntriesFromBundle(items: StepBundle[]): BranchEntry[] {
  const out: BranchEntry[] = [];
  for (const item of items) {
    const derived = newBranchEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyBranchEntry(item: BranchEntry): string {
  return stepBundleBucket(item.adjustedVolume());
}
