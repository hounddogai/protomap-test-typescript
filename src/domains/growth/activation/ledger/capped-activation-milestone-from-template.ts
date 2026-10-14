import { normalizeDefaultRetentionBatchCode } from "../../retention/template/default-retention-batch-policy.js";
import { RollingRetentionTemplate } from "../../retention/template/rolling-retention-template.js";
import { CappedActivationMilestone, newCappedActivationMilestone } from "./capped-activation-milestone.js";

export function summarizeRollingRetentionTemplatesForMilestone(items: RollingRetentionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedActivationMilestonesFromTemplate(items: RollingRetentionTemplate[]): CappedActivationMilestone[] {
  const out: CappedActivationMilestone[] = [];
  for (const item of items) {
    const derived = newCappedActivationMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCappedActivationMilestone(item: CappedActivationMilestone): string {
  return normalizeDefaultRetentionBatchCode(item.code);
}
