import * as text from "../../../../kit/text.js";
import { DoubleOptInRequest } from "./double-opt-in-request.js";

/** How screens and exports show a double opt in request. */
export class DoubleOptInRequestView {
  code: string;
  title: string;
  rate: string;
  maximum: string;
  checksumText: string;
  locale: string;
  updatedAtText: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    rate: string,
    maximum: string,
    checksumText: string,
    locale: string,
    updatedAtText: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.maximum = maximum;
    this.checksumText = checksumText;
    this.locale = locale;
    this.updatedAtText = updatedAtText;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInRequestView(item: DoubleOptInRequest): DoubleOptInRequestView {
  return new DoubleOptInRequestView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    item.rate.toFixed(2),
    item.maximum.toFixed(2),
    text.truncate(item.checksum, 40),
    item.locale,
    String(item.updatedAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInRequestViews(items: DoubleOptInRequest[]): DoubleOptInRequestView[] {
  const views: DoubleOptInRequestView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInRequestView(item));
  }
  return views;
}

export function sumDoubleOptInRequestView(view: DoubleOptInRequestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedRate + parsedMaximum + parsedUpdatedAt;
}
