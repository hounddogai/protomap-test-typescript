import { JourneyDigest } from "../../journey/cycle/journey-digest.js";
import { classifyPrimaryJourneyProposal } from "../../journey/cycle/primary-journey-proposal-policy.js";
import { ExitRuleCycle, newExitRuleCycle } from "./exit-rule-cycle.js";

export function summarizeJourneyDigestsForCycle(items: JourneyDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveExitRuleCyclesFromDigest(items: JourneyDigest[]): ExitRuleCycle[] {
  const out: ExitRuleCycle[] = [];
  for (const item of items) {
    const derived = newExitRuleCycle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchExitRuleCycle(item: ExitRuleCycle): string {
  return classifyPrimaryJourneyProposal(item.projectedTotal());
}
