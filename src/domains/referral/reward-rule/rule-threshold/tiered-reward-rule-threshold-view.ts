import * as text from "../../../../kit/text.js";
import { TieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

/** How screens and exports show a tiered reward rule threshold. */
export class TieredRewardRuleThresholdView {
  code: string;
  label: string;
  cost: string;
  currencyText: string;
  bid: string;
  scoreText: string;
  graceDays: string;
  descriptionText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    currencyText: string,
    bid: string,
    scoreText: string,
    graceDays: string,
    descriptionText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.currencyText = currencyText;
    this.bid = bid;
    this.scoreText = scoreText;
    this.graceDays = graceDays;
    this.descriptionText = descriptionText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleThresholdView(item: TieredRewardRuleThreshold): TieredRewardRuleThresholdView {
  return new TieredRewardRuleThresholdView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    text.truncate(item.currency, 80),
    item.bid.toFixed(2),
    item.score.toFixed(2),
    String(item.graceDays),
    item.description,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleThresholdViews(items: TieredRewardRuleThreshold[]): TieredRewardRuleThresholdView[] {
  const views: TieredRewardRuleThresholdView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleThresholdView(item));
  }
  return views;
}

export function sumTieredRewardRuleThresholdView(view: TieredRewardRuleThresholdView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedCost + parsedBid + parsedScore;
}
