import { NudgeException } from "../../nudge/snapshot/nudge-exception.js";
import { normalizeNudgeSnapshotCode } from "../../nudge/snapshot/nudge-snapshot-policy.js";
import { ActivationAudit, newActivationAudit } from "./activation-audit.js";

export function summarizeNudgeExceptionsForAudit(items: NudgeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveActivationAuditsFromException(items: NudgeException[]): ActivationAudit[] {
  const out: ActivationAudit[] = [];
  for (const item of items) {
    const derived = newActivationAudit(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitActivationAudit(item: ActivationAudit): string {
  return normalizeNudgeSnapshotCode(item.code);
}
