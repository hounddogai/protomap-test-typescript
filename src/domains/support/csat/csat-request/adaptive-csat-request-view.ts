import * as text from "../../../../kit/text.js";
import { AdaptiveCsatRequest } from "./adaptive-csat-request.js";

/** How screens and exports show a adaptive csat request. */
export class AdaptiveCsatRequestView {
  codeText: string;
  nameText: string;
  graceDaysText: string;
  source: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    graceDaysText: string,
    source: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.graceDaysText = graceDaysText;
    this.source = source;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCsatRequestView(item: AdaptiveCsatRequest): AdaptiveCsatRequestView {
  return new AdaptiveCsatRequestView(
    text.truncate(item.code, 64),
    item.name,
    String(item.graceDays),
    item.source,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCsatRequestViews(items: AdaptiveCsatRequest[]): AdaptiveCsatRequestView[] {
  const views: AdaptiveCsatRequestView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCsatRequestView(item));
  }
  return views;
}

export function sumAdaptiveCsatRequestView(view: AdaptiveCsatRequestView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
