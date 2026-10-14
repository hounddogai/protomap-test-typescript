import { MacroDigest } from "../../macro/threshold/macro-digest.js";
import { classifyMacroException } from "../../macro/threshold/macro-exception-policy.js";
import { EscalationMilestone, newEscalationMilestone } from "./escalation-milestone.js";

export function summarizeMacroDigestsForMilestone(items: MacroDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveEscalationMilestonesFromDigest(items: MacroDigest[]): EscalationMilestone[] {
  const out: EscalationMilestone[] = [];
  for (const item of items) {
    const derived = newEscalationMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitEscalationMilestone(item: EscalationMilestone): string {
  return classifyMacroException(item.effectiveVolume());
}
