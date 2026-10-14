import { PrimaryStepEntry } from "../../step/rule/primary-step-entry.js";
import { stepRuleBucket } from "../../step/rule/step-rule-policy.js";
import { StrictBranchManifest, newStrictBranchManifest } from "./strict-branch-manifest.js";

export function summarizePrimaryStepEntriesForManifest(items: PrimaryStepEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveStrictBranchManifestsFromEntry(items: PrimaryStepEntry[]): StrictBranchManifest[] {
  const out: StrictBranchManifest[] = [];
  for (const item of items) {
    const derived = newStrictBranchManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitStrictBranchManifest(item: StrictBranchManifest): string {
  return stepRuleBucket(item.effectiveVolume());
}
