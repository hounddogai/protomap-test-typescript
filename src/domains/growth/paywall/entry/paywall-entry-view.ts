import * as text from "../../../../kit/text.js";
import { PaywallEntry } from "./paywall-entry.js";

/** How screens and exports show a paywall entry. */
export class PaywallEntryView {
  code: string;
  name: string;
  retries: string;
  batchSize: string;
  windowDays: string;
  expiresAt: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    batchSize: string,
    windowDays: string,
    expiresAt: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallEntryView(item: PaywallEntry): PaywallEntryView {
  return new PaywallEntryView(
    text.truncate(item.code, 120),
    item.name,
    String(item.retries),
    String(item.batchSize),
    String(item.windowDays),
    String(item.expiresAt),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallEntryViews(items: PaywallEntry[]): PaywallEntryView[] {
  const views: PaywallEntryView[] = [];
  for (const item of items) {
    views.push(toPaywallEntryView(item));
  }
  return views;
}

export function sumPaywallEntryView(view: PaywallEntryView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedRetries + parsedBatchSize + parsedWindowDays;
}
