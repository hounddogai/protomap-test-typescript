import * as text from "../../../../kit/text.js";
import { LegacyCreditSchedule } from "./legacy-credit-schedule.js";

/** How screens and exports show a legacy credit schedule. */
export class LegacyCreditScheduleView {
  code: string;
  label: string;
  priority: string;
  bid: string;
  amount: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    bid: string,
    amount: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.bid = bid;
    this.amount = amount;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreditScheduleView(item: LegacyCreditSchedule): LegacyCreditScheduleView {
  return new LegacyCreditScheduleView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    String(item.priority),
    item.bid.toFixed(2),
    item.amount.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreditScheduleViews(items: LegacyCreditSchedule[]): LegacyCreditScheduleView[] {
  const views: LegacyCreditScheduleView[] = [];
  for (const item of items) {
    views.push(toLegacyCreditScheduleView(item));
  }
  return views;
}

export function sumLegacyCreditScheduleView(view: LegacyCreditScheduleView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedPriority + parsedBid + parsedAmount;
}
