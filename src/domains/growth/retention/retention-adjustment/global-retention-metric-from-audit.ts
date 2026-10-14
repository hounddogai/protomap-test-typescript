import { normalizeLenientNudgeBatchCode } from "../../nudge/nudge-batch/lenient-nudge-batch-policy.js";
import { NudgeAudit } from "../../nudge/nudge-batch/nudge-audit.js";
import { GlobalRetentionMetric, newGlobalRetentionMetric } from "./global-retention-metric.js";

export function summarizeNudgeAuditsForMetric(items: NudgeAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveGlobalRetentionMetricsFromAudit(items: NudgeAudit[]): GlobalRetentionMetric[] {
  const out: GlobalRetentionMetric[] = [];
  for (const item of items) {
    const derived = newGlobalRetentionMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileGlobalRetentionMetric(item: GlobalRetentionMetric): string {
  return normalizeLenientNudgeBatchCode(item.code);
}
