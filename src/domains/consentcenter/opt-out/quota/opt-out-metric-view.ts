import * as text from "../../../../kit/text.js";
import { OptOutMetric } from "./opt-out-metric.js";

/** How screens and exports show a opt out metric. */
export class OptOutMetricView {
  codeText: string;
  labelText: string;
  sendAtText: string;
  ceilingText: string;
  conversionRateText: string;
  variant: string;
  rate: string;
  visible: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sendAtText: string,
    ceilingText: string,
    conversionRateText: string,
    variant: string,
    rate: string,
    visible: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sendAtText = sendAtText;
    this.ceilingText = ceilingText;
    this.conversionRateText = conversionRateText;
    this.variant = variant;
    this.rate = rate;
    this.visible = visible;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutMetricView(item: OptOutMetric): OptOutMetricView {
  return new OptOutMetricView(
    text.truncate(item.code, 64),
    item.label,
    String(item.sendAt),
    item.ceiling.toFixed(2),
    item.conversionRate.toFixed(2),
    text.truncate(item.variant, 64),
    item.rate.toFixed(2),
    `${item.visible}`,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutMetricViews(items: OptOutMetric[]): OptOutMetricView[] {
  const views: OptOutMetricView[] = [];
  for (const item of items) {
    views.push(toOptOutMetricView(item));
  }
  return views;
}

export function sumOptOutMetricView(view: OptOutMetricView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedSendAt + parsedCeiling + parsedConversionRate;
}
