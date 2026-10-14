import { classifyLegacyStreakManifest } from "../../streak/manifest/legacy-streak-manifest-policy.js";
import { LegacyStreakManifest } from "../../streak/manifest/legacy-streak-manifest.js";
import { GlobalChallengeProposal, newGlobalChallengeProposal } from "./global-challenge-proposal.js";

export function summarizeLegacyStreakManifestsForProposal(items: LegacyStreakManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveGlobalChallengeProposalsFromManifest(items: LegacyStreakManifest[]): GlobalChallengeProposal[] {
  const out: GlobalChallengeProposal[] = [];
  for (const item of items) {
    const derived = newGlobalChallengeProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignGlobalChallengeProposal(item: GlobalChallengeProposal): string {
  return classifyLegacyStreakManifest(item.weightedTotal());
}
