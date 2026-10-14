import { StreakNotice } from "./streak-notice.js";

/** How screens and exports show a streak notice. */
export class StreakNoticeView {
  code: string;
  title: string;
  retries: string;
  minimum: string;
  weight: string;
  currency: string;
  labelText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    minimum: string,
    weight: string,
    currency: string,
    labelText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.minimum = minimum;
    this.weight = weight;
    this.currency = currency;
    this.labelText = labelText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toStreakNoticeView(item: StreakNotice): StreakNoticeView {
  return new StreakNoticeView(
    item.code,
    item.title,
    String(item.retries),
    item.minimum.toFixed(2),
    item.weight.toFixed(2),
    item.currency,
    item.label,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakNoticeViews(items: StreakNotice[]): StreakNoticeView[] {
  const views: StreakNoticeView[] = [];
  for (const item of items) {
    views.push(toStreakNoticeView(item));
  }
  return views;
}

export function sumStreakNoticeView(view: StreakNoticeView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedRetries + parsedMinimum + parsedWeight;
}
