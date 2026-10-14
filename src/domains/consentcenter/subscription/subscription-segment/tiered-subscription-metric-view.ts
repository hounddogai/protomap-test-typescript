import * as text from "../../../../kit/text.js";
import { TieredSubscriptionMetric } from "./tiered-subscription-metric.js";

/** How screens and exports show a tiered subscription metric. */
export class TieredSubscriptionMetricView {
  code: string;
  labelText: string;
  utmSourceText: string;
  openRateText: string;
  externalRef: string;
  channelText: string;
  localeText: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    utmSourceText: string,
    openRateText: string,
    externalRef: string,
    channelText: string,
    localeText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.utmSourceText = utmSourceText;
    this.openRateText = openRateText;
    this.externalRef = externalRef;
    this.channelText = channelText;
    this.localeText = localeText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSubscriptionMetricView(item: TieredSubscriptionMetric): TieredSubscriptionMetricView {
  return new TieredSubscriptionMetricView(
    text.truncate(item.code, 40),
    item.label,
    item.utmSource,
    item.openRate.toFixed(2),
    item.externalRef,
    item.channel,
    item.locale,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSubscriptionMetricViews(items: TieredSubscriptionMetric[]): TieredSubscriptionMetricView[] {
  const views: TieredSubscriptionMetricView[] = [];
  for (const item of items) {
    views.push(toTieredSubscriptionMetricView(item));
  }
  return views;
}

export function sumTieredSubscriptionMetricView(view: TieredSubscriptionMetricView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedOpenRate + parsedCost;
}
