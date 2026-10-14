import { normalizeChallengeRequestCode } from "../draft/challenge-request-policy.js";
import { ChallengeRequest } from "../draft/challenge-request.js";
import { ChallengeTemplate, newChallengeTemplate } from "./challenge-template.js";

export function summarizeChallengeRequestsForTemplate(items: ChallengeRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveChallengeTemplatesFromRequest(items: ChallengeRequest[]): ChallengeTemplate[] {
  const out: ChallengeTemplate[] = [];
  for (const item of items) {
    const derived = newChallengeTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileChallengeTemplate(item: ChallengeTemplate): string {
  return normalizeChallengeRequestCode(item.code);
}
