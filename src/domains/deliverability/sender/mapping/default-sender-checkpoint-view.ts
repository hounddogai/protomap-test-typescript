import * as text from "../../../../kit/text.js";
import { DefaultSenderCheckpoint } from "./default-sender-checkpoint.js";

/** How screens and exports show a default sender checkpoint. */
export class DefaultSenderCheckpointView {
  code: string;
  title: string;
  phone: string;
  active: string;
  bid: string;
  durationMinutes: string;
  capacity: string;
  budgetText: string;
  approved: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phone: string,
    active: string,
    bid: string,
    durationMinutes: string,
    capacity: string,
    budgetText: string,
    approved: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.active = active;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.budgetText = budgetText;
    this.approved = approved;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSenderCheckpointView(item: DefaultSenderCheckpoint): DefaultSenderCheckpointView {
  return new DefaultSenderCheckpointView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.phone, 64),
    `${item.active}`,
    item.bid.toFixed(2),
    String(item.durationMinutes),
    String(item.capacity),
    item.budget.toFixed(2),
    `${item.approved}`,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSenderCheckpointViews(items: DefaultSenderCheckpoint[]): DefaultSenderCheckpointView[] {
  const views: DefaultSenderCheckpointView[] = [];
  for (const item of items) {
    views.push(toDefaultSenderCheckpointView(item));
  }
  return views;
}

export function sumDefaultSenderCheckpointView(view: DefaultSenderCheckpointView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedCapacity;
}
