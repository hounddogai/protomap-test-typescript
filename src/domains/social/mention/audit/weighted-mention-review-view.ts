import { WeightedMentionReview } from "./weighted-mention-review.js";

/** How screens and exports show a weighted mention review. */
export class WeightedMentionReviewView {
  code: string;
  name: string;
  costText: string;
  expiresAtText: string;
  currency: string;
  createdAt: string;
  capacityText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    costText: string,
    expiresAtText: string,
    currency: string,
    createdAt: string,
    capacityText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.costText = costText;
    this.expiresAtText = expiresAtText;
    this.currency = currency;
    this.createdAt = createdAt;
    this.capacityText = capacityText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionReviewView(item: WeightedMentionReview): WeightedMentionReviewView {
  return new WeightedMentionReviewView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    String(item.expiresAt),
    item.currency,
    String(item.createdAt),
    String(item.capacity),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionReviewViews(items: WeightedMentionReview[]): WeightedMentionReviewView[] {
  const views: WeightedMentionReviewView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionReviewView(item));
  }
  return views;
}

export function sumWeightedMentionReviewView(view: WeightedMentionReviewView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCost + parsedExpiresAt + parsedCreatedAt;
}
