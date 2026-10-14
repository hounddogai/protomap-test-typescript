import * as text from "../../../../kit/text.js";
import { RollingWindowGroup } from "./rolling-window-group.js";

/** How screens and exports show a rolling window group. */
export class RollingWindowGroupView {
  codeText: string;
  title: string;
  rate: string;
  conversionRateText: string;
  description: string;
  limitText: string;
  currency: string;
  locale: string;
  clicks: string;
  ceiling: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rate: string,
    conversionRateText: string,
    description: string,
    limitText: string,
    currency: string,
    locale: string,
    clicks: string,
    ceiling: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rate = rate;
    this.conversionRateText = conversionRateText;
    this.description = description;
    this.limitText = limitText;
    this.currency = currency;
    this.locale = locale;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWindowGroupView(item: RollingWindowGroup): RollingWindowGroupView {
  return new RollingWindowGroupView(
    text.truncate(item.code, 40),
    item.title,
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.description, 80),
    String(item.limit),
    item.currency,
    item.locale,
    String(item.clicks),
    item.ceiling.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWindowGroupViews(items: RollingWindowGroup[]): RollingWindowGroupView[] {
  const views: RollingWindowGroupView[] = [];
  for (const item of items) {
    views.push(toRollingWindowGroupView(item));
  }
  return views;
}

export function sumRollingWindowGroupView(view: RollingWindowGroupView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedRate + parsedConversionRate + parsedLimit;
}
