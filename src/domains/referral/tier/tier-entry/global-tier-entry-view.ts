import * as text from "../../../../kit/text.js";
import { GlobalTierEntry } from "./global-tier-entry.js";

/** How screens and exports show a global tier entry. */
export class GlobalTierEntryView {
  code: string;
  title: string;
  sourceText: string;
  retries: string;
  countryText: string;
  activeText: string;
  bid: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sourceText: string,
    retries: string,
    countryText: string,
    activeText: string,
    bid: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sourceText = sourceText;
    this.retries = retries;
    this.countryText = countryText;
    this.activeText = activeText;
    this.bid = bid;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalTierEntryView(item: GlobalTierEntry): GlobalTierEntryView {
  return new GlobalTierEntryView(
    item.code,
    text.truncate(item.title, 40),
    item.source,
    String(item.retries),
    item.country,
    `${item.active}`,
    item.bid.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalTierEntryViews(items: GlobalTierEntry[]): GlobalTierEntryView[] {
  const views: GlobalTierEntryView[] = [];
  for (const item of items) {
    views.push(toGlobalTierEntryView(item));
  }
  return views;
}

export function sumGlobalTierEntryView(view: GlobalTierEntryView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRetries + parsedBid;
}
