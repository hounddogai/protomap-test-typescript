import { TieredRetentionScore } from "../../retention/retention-forecast/tiered-retention-score.js";
import { ManualNudgeException, newManualNudgeException } from "./manual-nudge-exception.js";

export function summarizeTieredRetentionScoresForException(items: TieredRetentionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveManualNudgeExceptionsFromScore(items: TieredRetentionScore[]): ManualNudgeException[] {
  const out: ManualNudgeException[] = [];
  for (const item of items) {
    const derived = newManualNudgeException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}
