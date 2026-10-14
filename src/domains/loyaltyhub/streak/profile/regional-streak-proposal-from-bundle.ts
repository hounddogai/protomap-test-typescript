import { normalizeGlobalStreakBundleCode } from "../forecast/global-streak-bundle-policy.js";
import { GlobalStreakBundle } from "../forecast/global-streak-bundle.js";
import { RegionalStreakProposal, newRegionalStreakProposal } from "./regional-streak-proposal.js";

export function summarizeGlobalStreakBundlesForProposal(items: GlobalStreakBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRegionalStreakProposalsFromBundle(items: GlobalStreakBundle[]): RegionalStreakProposal[] {
  const out: RegionalStreakProposal[] = [];
  for (const item of items) {
    const derived = newRegionalStreakProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRegionalStreakProposal(item: RegionalStreakProposal): string {
  return normalizeGlobalStreakBundleCode(item.code);
}
