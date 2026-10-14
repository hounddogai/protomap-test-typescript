import * as text from "../../../../kit/text.js";
import { SubscriptionClaim } from "./subscription-claim.js";

/** How screens and exports show a subscription claim. */
export class SubscriptionClaimView {
  code: string;
  title: string;
  priority: string;
  cost: string;
  ownerId: string;
  discount: string;
  rate: string;
  channel: string;
  quantity: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priority: string,
    cost: string,
    ownerId: string,
    discount: string,
    rate: string,
    channel: string,
    quantity: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cost = cost;
    this.ownerId = ownerId;
    this.discount = discount;
    this.rate = rate;
    this.channel = channel;
    this.quantity = quantity;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionClaimView(item: SubscriptionClaim): SubscriptionClaimView {
  return new SubscriptionClaimView(
    item.code,
    item.title,
    String(item.priority),
    item.cost.toFixed(2),
    item.ownerId,
    item.discount.toFixed(2),
    item.rate.toFixed(2),
    item.channel,
    String(item.quantity),
    text.truncate(item.source, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionClaimViews(items: SubscriptionClaim[]): SubscriptionClaimView[] {
  const views: SubscriptionClaimView[] = [];
  for (const item of items) {
    views.push(toSubscriptionClaimView(item));
  }
  return views;
}

export function sumSubscriptionClaimView(view: SubscriptionClaimView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedPriority + parsedCost + parsedDiscount;
}
