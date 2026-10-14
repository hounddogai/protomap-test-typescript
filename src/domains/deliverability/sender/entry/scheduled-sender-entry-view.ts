import * as text from "../../../../kit/text.js";
import { ScheduledSenderEntry } from "./scheduled-sender-entry.js";

/** How screens and exports show a scheduled sender entry. */
export class ScheduledSenderEntryView {
  code: string;
  title: string;
  journeyId: string;
  batchSizeText: string;
  localeText: string;
  name: string;
  impressions: string;
  rate: string;
  timezoneText: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    batchSizeText: string,
    localeText: string,
    name: string,
    impressions: string,
    rate: string,
    timezoneText: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.batchSizeText = batchSizeText;
    this.localeText = localeText;
    this.name = name;
    this.impressions = impressions;
    this.rate = rate;
    this.timezoneText = timezoneText;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSenderEntryView(item: ScheduledSenderEntry): ScheduledSenderEntryView {
  return new ScheduledSenderEntryView(
    item.code,
    item.title,
    text.truncate(item.journeyId, 120),
    String(item.batchSize),
    text.truncate(item.locale, 80),
    text.truncate(item.name, 64),
    String(item.impressions),
    item.rate.toFixed(2),
    text.truncate(item.timezone, 120),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSenderEntryViews(items: ScheduledSenderEntry[]): ScheduledSenderEntryView[] {
  const views: ScheduledSenderEntryView[] = [];
  for (const item of items) {
    views.push(toScheduledSenderEntryView(item));
  }
  return views;
}

export function sumScheduledSenderEntryView(view: ScheduledSenderEntryView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBatchSize + parsedImpressions + parsedRate;
}
