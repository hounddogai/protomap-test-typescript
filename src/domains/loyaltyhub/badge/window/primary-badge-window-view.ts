import * as text from "../../../../kit/text.js";
import { PrimaryBadgeWindow } from "./primary-badge-window.js";

/** How screens and exports show a primary badge window. */
export class PrimaryBadgeWindowView {
  code: string;
  name: string;
  channelText: string;
  timezone: string;
  revisionText: string;
  graceDaysText: string;
  notes: string;
  country: string;
  clicks: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channelText: string,
    timezone: string,
    revisionText: string,
    graceDaysText: string,
    notes: string,
    country: string,
    clicks: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channelText = channelText;
    this.timezone = timezone;
    this.revisionText = revisionText;
    this.graceDaysText = graceDaysText;
    this.notes = notes;
    this.country = country;
    this.clicks = clicks;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBadgeWindowView(item: PrimaryBadgeWindow): PrimaryBadgeWindowView {
  return new PrimaryBadgeWindowView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    item.channel,
    item.timezone,
    String(item.revision),
    String(item.graceDays),
    item.notes,
    text.truncate(item.country, 120),
    String(item.clicks),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBadgeWindowViews(items: PrimaryBadgeWindow[]): PrimaryBadgeWindowView[] {
  const views: PrimaryBadgeWindowView[] = [];
  for (const item of items) {
    views.push(toPrimaryBadgeWindowView(item));
  }
  return views;
}

export function sumPrimaryBadgeWindowView(view: PrimaryBadgeWindowView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRevision + parsedGraceDays + parsedClicks;
}
