import { classifyRetentionAudit } from "../../retention/audit/retention-audit-policy.js";
import { RetentionNotice } from "../../retention/audit/retention-notice.js";
import { NudgeProfile, newNudgeProfile } from "./nudge-profile.js";

export function summarizeRetentionNoticesForProfile(items: RetentionNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveNudgeProfilesFromNotice(items: RetentionNotice[]): NudgeProfile[] {
  const out: NudgeProfile[] = [];
  for (const item of items) {
    const derived = newNudgeProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceNudgeProfile(item: NudgeProfile): string {
  return classifyRetentionAudit(item.effectiveVolume());
}
