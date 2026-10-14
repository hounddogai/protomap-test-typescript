import { normalizeChallengeRequestCode } from "../../challenge/draft/challenge-request-policy.js";
import { ChallengeRequest } from "../../challenge/draft/challenge-request.js";
import { RedemptionTemplate, newRedemptionTemplate } from "./redemption-template.js";

export function summarizeChallengeRequestsForTemplate(items: ChallengeRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRedemptionTemplatesFromRequest(items: ChallengeRequest[]): RedemptionTemplate[] {
  const out: RedemptionTemplate[] = [];
  for (const item of items) {
    const derived = newRedemptionTemplate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeRedemptionTemplate(item: RedemptionTemplate): string {
  return normalizeChallengeRequestCode(item.code);
}
