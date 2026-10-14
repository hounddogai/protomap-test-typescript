import { PathOverride } from "./path-override.js";

/** How screens and exports show a path override. */
export class PathOverrideView {
  codeText: string;
  title: string;
  amount: string;
  conversionRate: string;
  updatedAtText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    amount: string,
    conversionRate: string,
    updatedAtText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.amount = amount;
    this.conversionRate = conversionRate;
    this.updatedAtText = updatedAtText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toPathOverrideView(item: PathOverride): PathOverrideView {
  return new PathOverrideView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.updatedAt),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathOverrideViews(items: PathOverride[]): PathOverrideView[] {
  const views: PathOverrideView[] = [];
  for (const item of items) {
    views.push(toPathOverrideView(item));
  }
  return views;
}

export function sumPathOverrideView(view: PathOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedAmount + parsedConversionRate + parsedUpdatedAt;
}
