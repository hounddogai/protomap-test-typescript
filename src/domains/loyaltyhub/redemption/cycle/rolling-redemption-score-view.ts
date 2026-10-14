import * as text from "../../../../kit/text.js";
import { RollingRedemptionScore } from "./rolling-redemption-score.js";

/** How screens and exports show a rolling redemption score. */
export class RollingRedemptionScoreView {
  code: string;
  title: string;
  utmSourceText: string;
  categoryText: string;
  budget: string;
  currencyText: string;
  threshold: string;
  score: string;
  label: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSourceText: string,
    categoryText: string,
    budget: string,
    currencyText: string,
    threshold: string,
    score: string,
    label: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.categoryText = categoryText;
    this.budget = budget;
    this.currencyText = currencyText;
    this.threshold = threshold;
    this.score = score;
    this.label = label;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRedemptionScoreView(item: RollingRedemptionScore): RollingRedemptionScoreView {
  return new RollingRedemptionScoreView(
    item.code,
    item.title,
    text.truncate(item.utmSource, 120),
    item.category,
    item.budget.toFixed(2),
    text.truncate(item.currency, 40),
    item.threshold.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.label, 40),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRedemptionScoreViews(items: RollingRedemptionScore[]): RollingRedemptionScoreView[] {
  const views: RollingRedemptionScoreView[] = [];
  for (const item of items) {
    views.push(toRollingRedemptionScoreView(item));
  }
  return views;
}

export function sumRollingRedemptionScoreView(view: RollingRedemptionScoreView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBudget + parsedThreshold + parsedScore;
}
