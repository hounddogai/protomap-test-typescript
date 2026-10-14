import { AdaptiveSubscriptionReview } from "./adaptive-subscription-review.js";

/** How screens and exports show a adaptive subscription review. */
export class AdaptiveSubscriptionReviewView {
  codeText: string;
  name: string;
  cohortText: string;
  cost: string;
  localeText: string;
  amount: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohortText: string,
    cost: string,
    localeText: string,
    amount: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohortText = cohortText;
    this.cost = cost;
    this.localeText = localeText;
    this.amount = amount;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSubscriptionReviewView(item: AdaptiveSubscriptionReview): AdaptiveSubscriptionReviewView {
  return new AdaptiveSubscriptionReviewView(
    item.code,
    item.name,
    item.cohort,
    item.cost.toFixed(2),
    item.locale,
    item.amount.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSubscriptionReviewViews(items: AdaptiveSubscriptionReview[]): AdaptiveSubscriptionReviewView[] {
  const views: AdaptiveSubscriptionReviewView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSubscriptionReviewView(item));
  }
  return views;
}

export function sumAdaptiveSubscriptionReviewView(view: AdaptiveSubscriptionReviewView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCost + parsedAmount + parsedRetries;
}
