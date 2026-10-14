import * as text from "../../../../kit/text.js";
import { DefaultSlaMetric } from "./default-sla-metric.js";

/** How screens and exports show a default sla metric. */
export class DefaultSlaMetricView {
  codeText: string;
  titleText: string;
  expiresAtText: string;
  currency: string;
  variant: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    expiresAtText: string,
    currency: string,
    variant: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.expiresAtText = expiresAtText;
    this.currency = currency;
    this.variant = variant;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSlaMetricView(item: DefaultSlaMetric): DefaultSlaMetricView {
  return new DefaultSlaMetricView(
    item.code,
    item.title,
    String(item.expiresAt),
    text.truncate(item.currency, 40),
    text.truncate(item.variant, 80),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSlaMetricViews(items: DefaultSlaMetric[]): DefaultSlaMetricView[] {
  const views: DefaultSlaMetricView[] = [];
  for (const item of items) {
    views.push(toDefaultSlaMetricView(item));
  }
  return views;
}

export function sumDefaultSlaMetricView(view: DefaultSlaMetricView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedExpiresAt + parsedFloorValue;
}
