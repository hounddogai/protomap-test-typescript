import { DefaultRewardRuleWindow } from "../../reward-rule/rule-claim/default-reward-rule-window.js";
import { normalizeRewardRuleReservationCode } from "../../reward-rule/rule-claim/reward-rule-reservation-policy.js";
import { FraudCheckAssignment, newFraudCheckAssignment } from "./fraud-check-assignment.js";

export function summarizeDefaultRewardRuleWindowsForAssignment(items: DefaultRewardRuleWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveFraudCheckAssignmentsFromWindow(items: DefaultRewardRuleWindow[]): FraudCheckAssignment[] {
  const out: FraudCheckAssignment[] = [];
  for (const item of items) {
    const derived = newFraudCheckAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeFraudCheckAssignment(item: FraudCheckAssignment): string {
  return normalizeRewardRuleReservationCode(item.code);
}
