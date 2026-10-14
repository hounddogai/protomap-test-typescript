import * as text from "../../../../kit/text.js";
import { StrictRetentionQuota } from "./strict-retention-quota.js";

/** How screens and exports show a strict retention quota. */
export class StrictRetentionQuotaView {
  codeText: string;
  title: string;
  bid: string;
  graceDaysText: string;
  attempts: string;
  category: string;
  variant: string;
  unit: string;
  windowDaysText: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    bid: string,
    graceDaysText: string,
    attempts: string,
    category: string,
    variant: string,
    unit: string,
    windowDaysText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.bid = bid;
    this.graceDaysText = graceDaysText;
    this.attempts = attempts;
    this.category = category;
    this.variant = variant;
    this.unit = unit;
    this.windowDaysText = windowDaysText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRetentionQuotaView(item: StrictRetentionQuota): StrictRetentionQuotaView {
  return new StrictRetentionQuotaView(
    text.truncate(item.code, 120),
    item.title,
    item.bid.toFixed(2),
    String(item.graceDays),
    String(item.attempts),
    item.category,
    item.variant,
    item.unit,
    String(item.windowDays),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRetentionQuotaViews(items: StrictRetentionQuota[]): StrictRetentionQuotaView[] {
  const views: StrictRetentionQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictRetentionQuotaView(item));
  }
  return views;
}

export function sumStrictRetentionQuotaView(view: StrictRetentionQuotaView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBid + parsedGraceDays + parsedAttempts;
}
