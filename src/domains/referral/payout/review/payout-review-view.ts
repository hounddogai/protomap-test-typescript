import * as text from "../../../../kit/text.js";
import { PayoutReview } from "./payout-review.js";

/** How screens and exports show a payout review. */
export class PayoutReviewView {
  code: string;
  label: string;
  weight: string;
  budgetText: string;
  locale: string;
  reviewer: string;
  externalRef: string;
  notes: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    budgetText: string,
    locale: string,
    reviewer: string,
    externalRef: string,
    notes: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.budgetText = budgetText;
    this.locale = locale;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.notes = notes;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutReviewView(item: PayoutReview): PayoutReviewView {
  return new PayoutReviewView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    item.locale,
    item.reviewer,
    item.externalRef,
    text.truncate(item.notes, 80),
    text.truncate(item.summary, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutReviewViews(items: PayoutReview[]): PayoutReviewView[] {
  const views: PayoutReviewView[] = [];
  for (const item of items) {
    views.push(toPayoutReviewView(item));
  }
  return views;
}

export function sumPayoutReviewView(view: PayoutReviewView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedWeight + parsedBudget;
}
