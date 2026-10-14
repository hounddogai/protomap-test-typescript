import * as text from "../../../../kit/text.js";
import { RewardRuleTarget } from "./reward-rule-target.js";

/** How screens and exports show a reward rule target. */
export class RewardRuleTargetView {
  code: string;
  label: string;
  timezone: string;
  journeyId: string;
  region: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    journeyId: string,
    region: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.region = region;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleTargetView(item: RewardRuleTarget): RewardRuleTargetView {
  return new RewardRuleTargetView(
    item.code,
    item.label,
    item.timezone,
    text.truncate(item.journeyId, 120),
    item.region,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleTargetViews(items: RewardRuleTarget[]): RewardRuleTargetView[] {
  const views: RewardRuleTargetView[] = [];
  for (const item of items) {
    views.push(toRewardRuleTargetView(item));
  }
  return views;
}

export function sumRewardRuleTargetView(view: RewardRuleTargetView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
