import * as text from "../../../../kit/text.js";
import { RegionalFunnelOverride } from "./regional-funnel-override.js";

/** How screens and exports show a regional funnel override. */
export class RegionalFunnelOverrideView {
  code: string;
  label: string;
  amount: string;
  windowDaysText: string;
  batchSize: string;
  rate: string;
  title: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    windowDaysText: string,
    batchSize: string,
    rate: string,
    title: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.windowDaysText = windowDaysText;
    this.batchSize = batchSize;
    this.rate = rate;
    this.title = title;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFunnelOverrideView(item: RegionalFunnelOverride): RegionalFunnelOverrideView {
  return new RegionalFunnelOverrideView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 64),
    item.amount.toFixed(2),
    String(item.windowDays),
    String(item.batchSize),
    item.rate.toFixed(2),
    item.title,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFunnelOverrideViews(items: RegionalFunnelOverride[]): RegionalFunnelOverrideView[] {
  const views: RegionalFunnelOverrideView[] = [];
  for (const item of items) {
    views.push(toRegionalFunnelOverrideView(item));
  }
  return views;
}

export function sumRegionalFunnelOverrideView(view: RegionalFunnelOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedAmount + parsedWindowDays + parsedBatchSize;
}
