import * as text from "../../../../kit/text.js";
import { PreferenceBaseline } from "./preference-baseline.js";

/** How screens and exports show a preference baseline. */
export class PreferenceBaselineView {
  codeText: string;
  name: string;
  bid: string;
  active: string;
  retries: string;
  durationMinutes: string;
  reviewer: string;
  checksum: string;
  externalRef: string;
  attempts: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    bid: string,
    active: string,
    retries: string,
    durationMinutes: string,
    reviewer: string,
    checksum: string,
    externalRef: string,
    attempts: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.bid = bid;
    this.active = active;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceBaselineView(item: PreferenceBaseline): PreferenceBaselineView {
  return new PreferenceBaselineView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    `${item.active}`,
    String(item.retries),
    String(item.durationMinutes),
    text.truncate(item.reviewer, 80),
    text.truncate(item.checksum, 64),
    item.externalRef,
    String(item.attempts),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceBaselineViews(items: PreferenceBaseline[]): PreferenceBaselineView[] {
  const views: PreferenceBaselineView[] = [];
  for (const item of items) {
    views.push(toPreferenceBaselineView(item));
  }
  return views;
}

export function sumPreferenceBaselineView(view: PreferenceBaselineView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBid + parsedRetries + parsedDurationMinutes;
}
