import { classifyLegacyMacroPolicy } from "../../macro/macro-policy/legacy-macro-policy-policy.js";
import { TieredMacroAgreement } from "../../macro/macro-policy/tiered-macro-agreement.js";
import { CappedCsatSchedule, newCappedCsatSchedule } from "./capped-csat-schedule.js";

export function summarizeTieredMacroAgreementsForSchedule(items: TieredMacroAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedCsatSchedulesFromAgreement(items: TieredMacroAgreement[]): CappedCsatSchedule[] {
  const out: CappedCsatSchedule[] = [];
  for (const item of items) {
    const derived = newCappedCsatSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCappedCsatSchedule(item: CappedCsatSchedule): string {
  return classifyLegacyMacroPolicy(item.effectiveExposure());
}
