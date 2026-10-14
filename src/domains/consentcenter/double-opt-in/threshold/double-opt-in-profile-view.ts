import * as text from "../../../../kit/text.js";
import { DoubleOptInProfile } from "./double-opt-in-profile.js";

/** How screens and exports show a double opt in profile. */
export class DoubleOptInProfileView {
  code: string;
  nameText: string;
  utmSourceText: string;
  durationMinutes: string;
  reviewerText: string;
  retriesText: string;
  bid: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    utmSourceText: string,
    durationMinutes: string,
    reviewerText: string,
    retriesText: string,
    bid: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.utmSourceText = utmSourceText;
    this.durationMinutes = durationMinutes;
    this.reviewerText = reviewerText;
    this.retriesText = retriesText;
    this.bid = bid;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInProfileView(item: DoubleOptInProfile): DoubleOptInProfileView {
  return new DoubleOptInProfileView(
    item.code,
    item.name,
    item.utmSource,
    String(item.durationMinutes),
    text.truncate(item.reviewer, 120),
    String(item.retries),
    item.bid.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInProfileViews(items: DoubleOptInProfile[]): DoubleOptInProfileView[] {
  const views: DoubleOptInProfileView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInProfileView(item));
  }
  return views;
}

export function sumDoubleOptInProfileView(view: DoubleOptInProfileView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedDurationMinutes + parsedRetries + parsedBid;
}
