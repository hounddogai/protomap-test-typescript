import * as text from "../../../../kit/text.js";
import { PendingPostCycle } from "./pending-post-cycle.js";

/** How screens and exports show a pending post cycle. */
export class PendingPostCycleView {
  code: string;
  name: string;
  margin: string;
  country: string;
  amount: string;
  capacity: string;
  startsAt: string;
  currencyText: string;
  score: string;
  threshold: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    country: string,
    amount: string,
    capacity: string,
    startsAt: string,
    currencyText: string,
    score: string,
    threshold: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.country = country;
    this.amount = amount;
    this.capacity = capacity;
    this.startsAt = startsAt;
    this.currencyText = currencyText;
    this.score = score;
    this.threshold = threshold;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPostCycleView(item: PendingPostCycle): PendingPostCycleView {
  return new PendingPostCycleView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    text.truncate(item.country, 64),
    item.amount.toFixed(2),
    String(item.capacity),
    String(item.startsAt),
    item.currency,
    item.score.toFixed(2),
    item.threshold.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPostCycleViews(items: PendingPostCycle[]): PendingPostCycleView[] {
  const views: PendingPostCycleView[] = [];
  for (const item of items) {
    views.push(toPendingPostCycleView(item));
  }
  return views;
}

export function sumPendingPostCycleView(view: PendingPostCycleView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedMargin + parsedAmount + parsedCapacity;
}
