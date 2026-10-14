import { seasonalPostDraftBucket } from "../post-milestone/seasonal-post-draft-policy.js";
import { SeasonalPostDraft } from "../post-milestone/seasonal-post-draft.js";
import { SeasonalPostOverride, newSeasonalPostOverride } from "./seasonal-post-override.js";

export function summarizeSeasonalPostDraftsForOverride(items: SeasonalPostDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSeasonalPostOverridesFromDraft(items: SeasonalPostDraft[]): SeasonalPostOverride[] {
  const out: SeasonalPostOverride[] = [];
  for (const item of items) {
    const derived = newSeasonalPostOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalPostOverride(item: SeasonalPostOverride): string {
  return seasonalPostDraftBucket(item.adjustedTotal());
}
