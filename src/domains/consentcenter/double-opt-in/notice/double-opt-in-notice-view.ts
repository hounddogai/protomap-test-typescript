import * as text from "../../../../kit/text.js";
import { DoubleOptInNotice } from "./double-opt-in-notice.js";

/** How screens and exports show a double opt in notice. */
export class DoubleOptInNoticeView {
  code: string;
  title: string;
  limit: string;
  country: string;
  campaignRef: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limit: string,
    country: string,
    campaignRef: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.country = country;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInNoticeView(item: DoubleOptInNotice): DoubleOptInNoticeView {
  return new DoubleOptInNoticeView(
    item.code,
    item.title,
    String(item.limit),
    text.truncate(item.country, 40),
    item.campaignRef,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInNoticeViews(items: DoubleOptInNotice[]): DoubleOptInNoticeView[] {
  const views: DoubleOptInNoticeView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInNoticeView(item));
  }
  return views;
}

export function sumDoubleOptInNoticeView(view: DoubleOptInNoticeView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedLimit;
}
