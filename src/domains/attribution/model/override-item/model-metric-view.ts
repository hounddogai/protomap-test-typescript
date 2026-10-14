import * as text from "../../../../kit/text.js";
import { ModelMetric } from "./model-metric.js";

/** How screens and exports show a model metric. */
export class ModelMetricView {
  code: string;
  labelText: string;
  windowDays: string;
  weightText: string;
  minimumText: string;
  variant: string;
  createdAt: string;
  campaignRefText: string;
  currencyText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    windowDays: string,
    weightText: string,
    minimumText: string,
    variant: string,
    createdAt: string,
    campaignRefText: string,
    currencyText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.windowDays = windowDays;
    this.weightText = weightText;
    this.minimumText = minimumText;
    this.variant = variant;
    this.createdAt = createdAt;
    this.campaignRefText = campaignRefText;
    this.currencyText = currencyText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toModelMetricView(item: ModelMetric): ModelMetricView {
  return new ModelMetricView(
    item.code,
    item.label,
    String(item.windowDays),
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    item.variant,
    String(item.createdAt),
    text.truncate(item.campaignRef, 120),
    item.currency,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelMetricViews(items: ModelMetric[]): ModelMetricView[] {
  const views: ModelMetricView[] = [];
  for (const item of items) {
    views.push(toModelMetricView(item));
  }
  return views;
}

export function sumModelMetricView(view: ModelMetricView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedWindowDays + parsedWeight + parsedMinimum;
}
