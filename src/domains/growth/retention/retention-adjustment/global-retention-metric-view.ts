import * as text from "../../../../kit/text.js";
import { GlobalRetentionMetric } from "./global-retention-metric.js";

/** How screens and exports show a global retention metric. */
export class GlobalRetentionMetricView {
  code: string;
  label: string;
  frequencyCap: string;
  contactEmail: string;
  graceDaysText: string;
  maximum: string;
  budget: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    contactEmail: string,
    graceDaysText: string,
    maximum: string,
    budget: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.contactEmail = contactEmail;
    this.graceDaysText = graceDaysText;
    this.maximum = maximum;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionMetricView(item: GlobalRetentionMetric): GlobalRetentionMetricView {
  return new GlobalRetentionMetricView(
    item.code,
    text.truncate(item.label, 40),
    String(item.frequencyCap),
    item.contactEmail,
    String(item.graceDays),
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionMetricViews(items: GlobalRetentionMetric[]): GlobalRetentionMetricView[] {
  const views: GlobalRetentionMetricView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionMetricView(item));
  }
  return views;
}

export function sumGlobalRetentionMetricView(view: GlobalRetentionMetricView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedFrequencyCap + parsedGraceDays + parsedMaximum;
}
