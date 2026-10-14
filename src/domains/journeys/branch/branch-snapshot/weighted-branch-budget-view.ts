import * as text from "../../../../kit/text.js";
import { WeightedBranchBudget } from "./weighted-branch-budget.js";

/** How screens and exports show a weighted branch budget. */
export class WeightedBranchBudgetView {
  codeText: string;
  title: string;
  discount: string;
  phoneText: string;
  threshold: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discount: string,
    phoneText: string,
    threshold: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.phoneText = phoneText;
    this.threshold = threshold;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBranchBudgetView(item: WeightedBranchBudget): WeightedBranchBudgetView {
  return new WeightedBranchBudgetView(
    text.truncate(item.code, 40),
    item.title,
    item.discount.toFixed(2),
    item.phone,
    item.threshold.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBranchBudgetViews(items: WeightedBranchBudget[]): WeightedBranchBudgetView[] {
  const views: WeightedBranchBudgetView[] = [];
  for (const item of items) {
    views.push(toWeightedBranchBudgetView(item));
  }
  return views;
}

export function sumWeightedBranchBudgetView(view: WeightedBranchBudgetView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedDiscount + parsedThreshold + parsedScore;
}
