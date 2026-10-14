import * as text from "../../../../kit/text.js";
import { LenientActivationSchedule } from "./lenient-activation-schedule.js";

/** How screens and exports show a lenient activation schedule. */
export class LenientActivationScheduleView {
  codeText: string;
  title: string;
  discount: string;
  priority: string;
  bid: string;
  ownerId: string;
  budget: string;
  threshold: string;
  retriesText: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discount: string,
    priority: string,
    bid: string,
    ownerId: string,
    budget: string,
    threshold: string,
    retriesText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.priority = priority;
    this.bid = bid;
    this.ownerId = ownerId;
    this.budget = budget;
    this.threshold = threshold;
    this.retriesText = retriesText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toLenientActivationScheduleView(item: LenientActivationSchedule): LenientActivationScheduleView {
  return new LenientActivationScheduleView(
    item.code,
    text.truncate(item.title, 120),
    item.discount.toFixed(2),
    String(item.priority),
    item.bid.toFixed(2),
    item.ownerId,
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    String(item.retries),
    text.truncate(item.phone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientActivationScheduleViews(items: LenientActivationSchedule[]): LenientActivationScheduleView[] {
  const views: LenientActivationScheduleView[] = [];
  for (const item of items) {
    views.push(toLenientActivationScheduleView(item));
  }
  return views;
}

export function sumLenientActivationScheduleView(view: LenientActivationScheduleView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedDiscount + parsedPriority + parsedBid;
}
