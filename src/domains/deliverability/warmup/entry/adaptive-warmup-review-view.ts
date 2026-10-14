import { AdaptiveWarmupReview } from "./adaptive-warmup-review.js";

/** How screens and exports show a adaptive warmup review. */
export class AdaptiveWarmupReviewView {
  codeText: string;
  nameText: string;
  category: string;
  currency: string;
  reviewer: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    category: string,
    currency: string,
    reviewer: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.category = category;
    this.currency = currency;
    this.reviewer = reviewer;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveWarmupReviewView(item: AdaptiveWarmupReview): AdaptiveWarmupReviewView {
  return new AdaptiveWarmupReviewView(
    item.code,
    item.name,
    item.category,
    item.currency,
    item.reviewer,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveWarmupReviewViews(items: AdaptiveWarmupReview[]): AdaptiveWarmupReviewView[] {
  const views: AdaptiveWarmupReviewView[] = [];
  for (const item of items) {
    views.push(toAdaptiveWarmupReviewView(item));
  }
  return views;
}

export function sumAdaptiveWarmupReviewView(view: AdaptiveWarmupReviewView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
