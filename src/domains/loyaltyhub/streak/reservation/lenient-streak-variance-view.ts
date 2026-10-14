import * as text from "../../../../kit/text.js";
import { LenientStreakVariance } from "./lenient-streak-variance.js";

/** How screens and exports show a lenient streak variance. */
export class LenientStreakVarianceView {
  codeText: string;
  title: string;
  budget: string;
  ownerId: string;
  name: string;
  capacity: string;
  externalRef: string;
  currency: string;
  locale: string;
  bid: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    ownerId: string,
    name: string,
    capacity: string,
    externalRef: string,
    currency: string,
    locale: string,
    bid: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.ownerId = ownerId;
    this.name = name;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.currency = currency;
    this.locale = locale;
    this.bid = bid;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientStreakVarianceView(item: LenientStreakVariance): LenientStreakVarianceView {
  return new LenientStreakVarianceView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.ownerId,
    text.truncate(item.name, 120),
    String(item.capacity),
    text.truncate(item.externalRef, 120),
    item.currency,
    item.locale,
    item.bid.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientStreakVarianceViews(items: LenientStreakVariance[]): LenientStreakVarianceView[] {
  const views: LenientStreakVarianceView[] = [];
  for (const item of items) {
    views.push(toLenientStreakVarianceView(item));
  }
  return views;
}

export function sumLenientStreakVarianceView(view: LenientStreakVarianceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBudget + parsedCapacity + parsedBid;
}
