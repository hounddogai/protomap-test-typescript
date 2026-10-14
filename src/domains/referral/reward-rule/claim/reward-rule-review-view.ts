import { RewardRuleReview } from "./reward-rule-review.js";

/** How screens and exports show a reward rule review. */
export class RewardRuleReviewView {
  code: string;
  titleText: string;
  channel: string;
  unit: string;
  reviewer: string;
  retries: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    unit: string,
    reviewer: string,
    retries: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.unit = unit;
    this.reviewer = reviewer;
    this.retries = retries;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleReviewView(item: RewardRuleReview): RewardRuleReviewView {
  return new RewardRuleReviewView(
    item.code,
    item.title,
    item.channel,
    item.unit,
    item.reviewer,
    String(item.retries),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleReviewViews(items: RewardRuleReview[]): RewardRuleReviewView[] {
  const views: RewardRuleReviewView[] = [];
  for (const item of items) {
    views.push(toRewardRuleReviewView(item));
  }
  return views;
}

export function sumRewardRuleReviewView(view: RewardRuleReviewView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
