import * as text from "../../../../kit/text.js";
import { SlaMetric } from "./sla-metric.js";

/** How screens and exports show a sla metric. */
export class SlaMetricView {
  codeText: string;
  labelText: string;
  limit: string;
  openRateText: string;
  statusLabel: string;

  constructor(codeText: string, labelText: string, limit: string, openRateText: string, statusLabel: string) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.limit = limit;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaMetricView(item: SlaMetric): SlaMetricView {
  return new SlaMetricView(
    item.code,
    text.truncate(item.label, 120),
    String(item.limit),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaMetricViews(items: SlaMetric[]): SlaMetricView[] {
  const views: SlaMetricView[] = [];
  for (const item of items) {
    views.push(toSlaMetricView(item));
  }
  return views;
}

export function sumSlaMetricView(view: SlaMetricView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedLimit + parsedOpenRate;
}
