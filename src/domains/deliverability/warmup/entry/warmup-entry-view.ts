import * as text from "../../../../kit/text.js";
import { WarmupEntry } from "./warmup-entry.js";

/** How screens and exports show a warmup entry. */
export class WarmupEntryView {
  codeText: string;
  title: string;
  locale: string;
  externalRefText: string;
  retriesText: string;
  durationMinutesText: string;
  bid: string;
  maximum: string;
  campaignRefText: string;
  ceilingText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    externalRefText: string,
    retriesText: string,
    durationMinutesText: string,
    bid: string,
    maximum: string,
    campaignRefText: string,
    ceilingText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.externalRefText = externalRefText;
    this.retriesText = retriesText;
    this.durationMinutesText = durationMinutesText;
    this.bid = bid;
    this.maximum = maximum;
    this.campaignRefText = campaignRefText;
    this.ceilingText = ceilingText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupEntryView(item: WarmupEntry): WarmupEntryView {
  return new WarmupEntryView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.locale, 40),
    item.externalRef,
    String(item.retries),
    String(item.durationMinutes),
    item.bid.toFixed(2),
    item.maximum.toFixed(2),
    item.campaignRef,
    item.ceiling.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupEntryViews(items: WarmupEntry[]): WarmupEntryView[] {
  const views: WarmupEntryView[] = [];
  for (const item of items) {
    views.push(toWarmupEntryView(item));
  }
  return views;
}

export function sumWarmupEntryView(view: WarmupEntryView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRetries + parsedDurationMinutes + parsedBid;
}
