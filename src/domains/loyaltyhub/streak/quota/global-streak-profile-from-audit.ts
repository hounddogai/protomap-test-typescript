import { normalizeStreakAuditCode } from "../batch/streak-audit-policy.js";
import { StreakAudit } from "../batch/streak-audit.js";
import { GlobalStreakProfile, newGlobalStreakProfile } from "./global-streak-profile.js";

export function summarizeStreakAuditsForProfile(items: StreakAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveGlobalStreakProfilesFromAudit(items: StreakAudit[]): GlobalStreakProfile[] {
  const out: GlobalStreakProfile[] = [];
  for (const item of items) {
    const derived = newGlobalStreakProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planGlobalStreakProfile(item: GlobalStreakProfile): string {
  return normalizeStreakAuditCode(item.code);
}
