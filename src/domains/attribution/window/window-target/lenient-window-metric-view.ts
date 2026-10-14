import * as text from "../../../../kit/text.js";
import { LenientWindowMetric } from "./lenient-window-metric.js";

/** How screens and exports show a lenient window metric. */
export class LenientWindowMetricView {
  code: string;
  label: string;
  openRateText: string;
  channel: string;
  conversionRate: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRateText: string,
    channel: string,
    conversionRate: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRateText = openRateText;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWindowMetricView(item: LenientWindowMetric): LenientWindowMetricView {
  return new LenientWindowMetricView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    text.truncate(item.channel, 120),
    item.conversionRate.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWindowMetricViews(items: LenientWindowMetric[]): LenientWindowMetricView[] {
  const views: LenientWindowMetricView[] = [];
  for (const item of items) {
    views.push(toLenientWindowMetricView(item));
  }
  return views;
}

export function sumLenientWindowMetricView(view: LenientWindowMetricView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedOpenRate + parsedConversionRate + parsedBudget;
}
