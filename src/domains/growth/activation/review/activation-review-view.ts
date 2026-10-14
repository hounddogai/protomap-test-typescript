import * as text from "../../../../kit/text.js";
import { ActivationReview } from "./activation-review.js";

/** How screens and exports show a activation review. */
export class ActivationReviewView {
  codeText: string;
  title: string;
  categoryText: string;
  budgetText: string;
  label: string;
  timezone: string;
  floorValue: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    categoryText: string,
    budgetText: string,
    label: string,
    timezone: string,
    floorValue: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.categoryText = categoryText;
    this.budgetText = budgetText;
    this.label = label;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toActivationReviewView(item: ActivationReview): ActivationReviewView {
  return new ActivationReviewView(
    item.code,
    item.title,
    text.truncate(item.category, 120),
    item.budget.toFixed(2),
    item.label,
    text.truncate(item.timezone, 80),
    item.floorValue.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationReviewViews(items: ActivationReview[]): ActivationReviewView[] {
  const views: ActivationReviewView[] = [];
  for (const item of items) {
    views.push(toActivationReviewView(item));
  }
  return views;
}

export function sumActivationReviewView(view: ActivationReviewView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBudget + parsedFloorValue + parsedLimit;
}
