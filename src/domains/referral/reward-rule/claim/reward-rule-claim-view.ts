import { RewardRuleClaim } from "./reward-rule-claim.js";

/** How screens and exports show a reward rule claim. */
export class RewardRuleClaimView {
  codeText: string;
  label: string;
  source: string;
  phoneText: string;
  limitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    source: string,
    phoneText: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.source = source;
    this.phoneText = phoneText;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleClaimView(item: RewardRuleClaim): RewardRuleClaimView {
  return new RewardRuleClaimView(
    item.code,
    item.label,
    item.source,
    item.phone,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleClaimViews(items: RewardRuleClaim[]): RewardRuleClaimView[] {
  const views: RewardRuleClaimView[] = [];
  for (const item of items) {
    views.push(toRewardRuleClaimView(item));
  }
  return views;
}

export function sumRewardRuleClaimView(view: RewardRuleClaimView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedLimit;
}
