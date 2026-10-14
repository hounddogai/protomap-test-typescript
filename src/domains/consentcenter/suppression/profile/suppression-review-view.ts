import * as text from "../../../../kit/text.js";
import { SuppressionReview } from "./suppression-review.js";

/** How screens and exports show a suppression review. */
export class SuppressionReviewView {
  code: string;
  name: string;
  region: string;
  margin: string;
  cohort: string;
  phone: string;
  budgetText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    margin: string,
    cohort: string,
    phone: string,
    budgetText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.margin = margin;
    this.cohort = cohort;
    this.phone = phone;
    this.budgetText = budgetText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionReviewView(item: SuppressionReview): SuppressionReviewView {
  return new SuppressionReviewView(
    item.code,
    item.name,
    text.truncate(item.region, 120),
    item.margin.toFixed(2),
    text.truncate(item.cohort, 40),
    item.phone,
    item.budget.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionReviewViews(items: SuppressionReview[]): SuppressionReviewView[] {
  const views: SuppressionReviewView[] = [];
  for (const item of items) {
    views.push(toSuppressionReviewView(item));
  }
  return views;
}

export function sumSuppressionReviewView(view: SuppressionReviewView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedMargin + parsedBudget;
}
