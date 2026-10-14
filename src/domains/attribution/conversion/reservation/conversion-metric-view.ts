import * as text from "../../../../kit/text.js";
import { ConversionMetric } from "./conversion-metric.js";

/** How screens and exports show a conversion metric. */
export class ConversionMetricView {
  code: string;
  labelText: string;
  revision: string;
  description: string;
  retries: string;
  conversionRate: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    revision: string,
    description: string,
    retries: string,
    conversionRate: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.revision = revision;
    this.description = description;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toConversionMetricView(item: ConversionMetric): ConversionMetricView {
  return new ConversionMetricView(
    item.code,
    item.label,
    String(item.revision),
    text.truncate(item.description, 80),
    String(item.retries),
    item.conversionRate.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionMetricViews(items: ConversionMetric[]): ConversionMetricView[] {
  const views: ConversionMetricView[] = [];
  for (const item of items) {
    views.push(toConversionMetricView(item));
  }
  return views;
}

export function sumConversionMetricView(view: ConversionMetricView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedRevision + parsedRetries + parsedConversionRate;
}
