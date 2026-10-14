import * as text from "../../../../kit/text.js";
import { DefaultBounceMetric } from "./default-bounce-metric.js";

/** How screens and exports show a default bounce metric. */
export class DefaultBounceMetricView {
  codeText: string;
  label: string;
  graceDays: string;
  openRate: string;
  region: string;
  createdAt: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDays: string,
    openRate: string,
    region: string,
    createdAt: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.region = region;
    this.createdAt = createdAt;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBounceMetricView(item: DefaultBounceMetric): DefaultBounceMetricView {
  return new DefaultBounceMetricView(
    text.truncate(item.code, 64),
    item.label,
    String(item.graceDays),
    item.openRate.toFixed(2),
    item.region,
    String(item.createdAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBounceMetricViews(items: DefaultBounceMetric[]): DefaultBounceMetricView[] {
  const views: DefaultBounceMetricView[] = [];
  for (const item of items) {
    views.push(toDefaultBounceMetricView(item));
  }
  return views;
}

export function sumDefaultBounceMetricView(view: DefaultBounceMetricView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedGraceDays + parsedOpenRate + parsedCreatedAt;
}
