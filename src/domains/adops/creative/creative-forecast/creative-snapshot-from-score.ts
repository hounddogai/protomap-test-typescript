import { normalizeCreativeDraftCode } from "../draft/creative-draft-policy.js";
import { CreativeScore } from "../draft/creative-score.js";
import { CreativeSnapshot, newCreativeSnapshot } from "./creative-snapshot.js";

export function summarizeCreativeScoresForSnapshot(items: CreativeScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveCreativeSnapshotsFromScore(items: CreativeScore[]): CreativeSnapshot[] {
  const out: CreativeSnapshot[] = [];
  for (const item of items) {
    const derived = newCreativeSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCreativeSnapshot(item: CreativeSnapshot): string {
  return normalizeCreativeDraftCode(item.code);
}
