import * as text from "../../../../kit/text.js";
import { CreditEstimate } from "./credit-estimate.js";

/** How screens and exports show a credit estimate. */
export class CreditEstimateView {
  code: string;
  title: string;
  checksumText: string;
  channel: string;
  capacity: string;
  clicksText: string;
  windowDays: string;
  ratio: string;
  batchSizeText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    checksumText: string,
    channel: string,
    capacity: string,
    clicksText: string,
    windowDays: string,
    ratio: string,
    batchSizeText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.checksumText = checksumText;
    this.channel = channel;
    this.capacity = capacity;
    this.clicksText = clicksText;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.batchSizeText = batchSizeText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toCreditEstimateView(item: CreditEstimate): CreditEstimateView {
  return new CreditEstimateView(
    item.code,
    item.title,
    item.checksum,
    item.channel,
    String(item.capacity),
    String(item.clicks),
    String(item.windowDays),
    item.ratio.toFixed(2),
    String(item.batchSize),
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditEstimateViews(items: CreditEstimate[]): CreditEstimateView[] {
  const views: CreditEstimateView[] = [];
  for (const item of items) {
    views.push(toCreditEstimateView(item));
  }
  return views;
}

export function sumCreditEstimateView(view: CreditEstimateView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCapacity + parsedClicks + parsedWindowDays;
}
