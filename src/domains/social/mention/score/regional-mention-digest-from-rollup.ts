import { GlobalPostRollup } from "../../post/score/global-post-rollup.js";
import { normalizeScheduledPostScoreCode } from "../../post/score/scheduled-post-score-policy.js";
import { RegionalMentionDigest, newRegionalMentionDigest } from "./regional-mention-digest.js";

export function summarizeGlobalPostRollupsForDigest(items: GlobalPostRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRegionalMentionDigestsFromRollup(items: GlobalPostRollup[]): RegionalMentionDigest[] {
  const out: RegionalMentionDigest[] = [];
  for (const item of items) {
    const derived = newRegionalMentionDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRegionalMentionDigest(item: RegionalMentionDigest): string {
  return normalizeScheduledPostScoreCode(item.code);
}
