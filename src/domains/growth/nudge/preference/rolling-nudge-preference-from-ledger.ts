import {
  normalizeWeightedActivationLedgerCode,
} from "../../activation/adjustment/weighted-activation-ledger-policy.js";
import { WeightedActivationLedger } from "../../activation/adjustment/weighted-activation-ledger.js";
import { RollingNudgePreference, newRollingNudgePreference } from "./rolling-nudge-preference.js";

export function summarizeWeightedActivationLedgersForPreference(items: WeightedActivationLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveRollingNudgePreferencesFromLedger(items: WeightedActivationLedger[]): RollingNudgePreference[] {
  const out: RollingNudgePreference[] = [];
  for (const item of items) {
    const derived = newRollingNudgePreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingNudgePreference(item: RollingNudgePreference): string {
  return normalizeWeightedActivationLedgerCode(item.code);
}
