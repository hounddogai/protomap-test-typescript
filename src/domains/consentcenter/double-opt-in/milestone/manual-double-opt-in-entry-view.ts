import { ManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

/** How screens and exports show a manual double opt in entry. */
export class ManualDoubleOptInEntryView {
  code: string;
  titleText: string;
  bid: string;
  externalRefText: string;
  durationMinutesText: string;
  windowDays: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    bid: string,
    externalRefText: string,
    durationMinutesText: string,
    windowDays: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.bid = bid;
    this.externalRefText = externalRefText;
    this.durationMinutesText = durationMinutesText;
    this.windowDays = windowDays;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toManualDoubleOptInEntryView(item: ManualDoubleOptInEntry): ManualDoubleOptInEntryView {
  return new ManualDoubleOptInEntryView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.externalRef,
    String(item.durationMinutes),
    String(item.windowDays),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualDoubleOptInEntryViews(items: ManualDoubleOptInEntry[]): ManualDoubleOptInEntryView[] {
  const views: ManualDoubleOptInEntryView[] = [];
  for (const item of items) {
    views.push(toManualDoubleOptInEntryView(item));
  }
  return views;
}

export function sumManualDoubleOptInEntryView(view: ManualDoubleOptInEntryView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedWindowDays;
}
