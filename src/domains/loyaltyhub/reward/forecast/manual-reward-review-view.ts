import * as text from "../../../../kit/text.js";
import { ManualRewardReview } from "./manual-reward-review.js";

/** How screens and exports show a manual reward review. */
export class ManualRewardReviewView {
  code: string;
  name: string;
  reviewer: string;
  budgetText: string;
  updatedAtText: string;
  locale: string;
  ownerId: string;
  timezone: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    budgetText: string,
    updatedAtText: string,
    locale: string,
    ownerId: string,
    timezone: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.budgetText = budgetText;
    this.updatedAtText = updatedAtText;
    this.locale = locale;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toManualRewardReviewView(item: ManualRewardReview): ManualRewardReviewView {
  return new ManualRewardReviewView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    item.reviewer,
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.locale,
    text.truncate(item.ownerId, 120),
    item.timezone,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRewardReviewViews(items: ManualRewardReview[]): ManualRewardReviewView[] {
  const views: ManualRewardReviewView[] = [];
  for (const item of items) {
    views.push(toManualRewardReviewView(item));
  }
  return views;
}

export function sumManualRewardReviewView(view: ManualRewardReviewView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedBudget + parsedUpdatedAt + parsedCost;
}
