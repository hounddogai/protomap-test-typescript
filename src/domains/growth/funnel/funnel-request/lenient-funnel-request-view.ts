import * as text from "../../../../kit/text.js";
import { LenientFunnelRequest } from "./lenient-funnel-request.js";

/** How screens and exports show a lenient funnel request. */
export class LenientFunnelRequestView {
  code: string;
  titleText: string;
  windowDays: string;
  retries: string;
  unit: string;
  minimum: string;
  updatedAt: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    windowDays: string,
    retries: string,
    unit: string,
    minimum: string,
    updatedAt: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.windowDays = windowDays;
    this.retries = retries;
    this.unit = unit;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFunnelRequestView(item: LenientFunnelRequest): LenientFunnelRequestView {
  return new LenientFunnelRequestView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    String(item.windowDays),
    String(item.retries),
    text.truncate(item.unit, 80),
    item.minimum.toFixed(2),
    String(item.updatedAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFunnelRequestViews(items: LenientFunnelRequest[]): LenientFunnelRequestView[] {
  const views: LenientFunnelRequestView[] = [];
  for (const item of items) {
    views.push(toLenientFunnelRequestView(item));
  }
  return views;
}

export function sumLenientFunnelRequestView(view: LenientFunnelRequestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedWindowDays + parsedRetries + parsedMinimum;
}
