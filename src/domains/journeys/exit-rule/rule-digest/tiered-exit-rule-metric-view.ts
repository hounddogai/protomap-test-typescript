import * as text from "../../../../kit/text.js";
import { TieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

/** How screens and exports show a tiered exit rule metric. */
export class TieredExitRuleMetricView {
  code: string;
  title: string;
  amount: string;
  clicks: string;
  retries: string;
  conversionRate: string;
  activeText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    clicks: string,
    retries: string,
    conversionRate: string,
    activeText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.clicks = clicks;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.activeText = activeText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toTieredExitRuleMetricView(item: TieredExitRuleMetric): TieredExitRuleMetricView {
  return new TieredExitRuleMetricView(
    item.code,
    text.truncate(item.title, 120),
    item.amount.toFixed(2),
    String(item.clicks),
    String(item.retries),
    item.conversionRate.toFixed(2),
    `${item.active}`,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredExitRuleMetricViews(items: TieredExitRuleMetric[]): TieredExitRuleMetricView[] {
  const views: TieredExitRuleMetricView[] = [];
  for (const item of items) {
    views.push(toTieredExitRuleMetricView(item));
  }
  return views;
}

export function sumTieredExitRuleMetricView(view: TieredExitRuleMetricView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAmount + parsedClicks + parsedRetries;
}
