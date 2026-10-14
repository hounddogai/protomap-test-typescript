import * as text from "../../../../kit/text.js";
import { StrictReplyClaim } from "./strict-reply-claim.js";

/** How screens and exports show a strict reply claim. */
export class StrictReplyClaimView {
  code: string;
  titleText: string;
  endsAtText: string;
  categoryText: string;
  minimum: string;
  amount: string;
  ownerIdText: string;
  region: string;
  budget: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAtText: string,
    categoryText: string,
    minimum: string,
    amount: string,
    ownerIdText: string,
    region: string,
    budget: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAtText = endsAtText;
    this.categoryText = categoryText;
    this.minimum = minimum;
    this.amount = amount;
    this.ownerIdText = ownerIdText;
    this.region = region;
    this.budget = budget;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toStrictReplyClaimView(item: StrictReplyClaim): StrictReplyClaimView {
  return new StrictReplyClaimView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    String(item.endsAt),
    text.truncate(item.category, 40),
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    item.ownerId,
    item.region,
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictReplyClaimViews(items: StrictReplyClaim[]): StrictReplyClaimView[] {
  const views: StrictReplyClaimView[] = [];
  for (const item of items) {
    views.push(toStrictReplyClaimView(item));
  }
  return views;
}

export function sumStrictReplyClaimView(view: StrictReplyClaimView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedEndsAt + parsedMinimum + parsedAmount;
}
