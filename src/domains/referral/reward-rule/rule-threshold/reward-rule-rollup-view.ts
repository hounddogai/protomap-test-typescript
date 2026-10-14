import * as text from "../../../../kit/text.js";
import { RewardRuleRollup } from "./reward-rule-rollup.js";

/** How screens and exports show a reward rule rollup. */
export class RewardRuleRollupView {
  codeText: string;
  titleText: string;
  amount: string;
  audienceIdText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    amount: string,
    audienceIdText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.amount = amount;
    this.audienceIdText = audienceIdText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleRollupView(item: RewardRuleRollup): RewardRuleRollupView {
  return new RewardRuleRollupView(
    text.truncate(item.code, 40),
    item.title,
    item.amount.toFixed(2),
    text.truncate(item.audienceId, 120),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleRollupViews(items: RewardRuleRollup[]): RewardRuleRollupView[] {
  const views: RewardRuleRollupView[] = [];
  for (const item of items) {
    views.push(toRewardRuleRollupView(item));
  }
  return views;
}

export function sumRewardRuleRollupView(view: RewardRuleRollupView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedAmount + parsedSequence;
}
