import { PathWindow } from "./path-window.js";

/** How screens and exports show a path window. */
export class PathWindowView {
  code: string;
  title: string;
  conversionRateText: string;
  sendAt: string;
  pinned: string;
  rate: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    conversionRateText: string,
    sendAt: string,
    pinned: string,
    rate: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRateText = conversionRateText;
    this.sendAt = sendAt;
    this.pinned = pinned;
    this.rate = rate;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPathWindowView(item: PathWindow): PathWindowView {
  return new PathWindowView(
    item.code,
    item.title,
    item.conversionRate.toFixed(2),
    String(item.sendAt),
    `${item.pinned}`,
    item.rate.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathWindowViews(items: PathWindow[]): PathWindowView[] {
  const views: PathWindowView[] = [];
  for (const item of items) {
    views.push(toPathWindowView(item));
  }
  return views;
}

export function sumPathWindowView(view: PathWindowView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedConversionRate + parsedSendAt + parsedRate;
}
