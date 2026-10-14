import * as text from "../../../../kit/text.js";
import { DomainEntry } from "./domain-entry.js";

/** How screens and exports show a domain entry. */
export class DomainEntryView {
  code: string;
  name: string;
  threshold: string;
  endsAtText: string;
  region: string;
  windowDays: string;
  timezoneText: string;
  pinned: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    endsAtText: string,
    region: string,
    windowDays: string,
    timezoneText: string,
    pinned: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.endsAtText = endsAtText;
    this.region = region;
    this.windowDays = windowDays;
    this.timezoneText = timezoneText;
    this.pinned = pinned;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDomainEntryView(item: DomainEntry): DomainEntryView {
  return new DomainEntryView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.endsAt),
    item.region,
    String(item.windowDays),
    item.timezone,
    `${item.pinned}`,
    text.truncate(item.unit, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainEntryViews(items: DomainEntry[]): DomainEntryView[] {
  const views: DomainEntryView[] = [];
  for (const item of items) {
    views.push(toDomainEntryView(item));
  }
  return views;
}

export function sumDomainEntryView(view: DomainEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedThreshold + parsedEndsAt + parsedWindowDays;
}
