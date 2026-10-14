import {
  normalizePrimaryChallengeManifestCode,
} from "../../challenge/challenge-override/primary-challenge-manifest-policy.js";
import { PrimaryChallengeManifest } from "../../challenge/challenge-override/primary-challenge-manifest.js";
import { PendingRewardRollup, newPendingRewardRollup } from "./pending-reward-rollup.js";

export function summarizePrimaryChallengeManifestsForRollup(items: PrimaryChallengeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePendingRewardRollupsFromManifest(items: PrimaryChallengeManifest[]): PendingRewardRollup[] {
  const out: PendingRewardRollup[] = [];
  for (const item of items) {
    const derived = newPendingRewardRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePendingRewardRollup(item: PendingRewardRollup): string {
  return normalizePrimaryChallengeManifestCode(item.code);
}
