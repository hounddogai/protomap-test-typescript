import { FallbackSenderMetric } from "./fallback-sender-metric.js";

/** How screens and exports show a fallback sender metric. */
export class FallbackSenderMetricView {
  code: string;
  label: string;
  pinned: string;
  timezoneText: string;
  visible: string;
  weightText: string;
  maximum: string;
  sendAt: string;
  limit: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    timezoneText: string,
    visible: string,
    weightText: string,
    maximum: string,
    sendAt: string,
    limit: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.timezoneText = timezoneText;
    this.visible = visible;
    this.weightText = weightText;
    this.maximum = maximum;
    this.sendAt = sendAt;
    this.limit = limit;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderMetricView(item: FallbackSenderMetric): FallbackSenderMetricView {
  return new FallbackSenderMetricView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.timezone,
    `${item.visible}`,
    item.weight.toFixed(2),
    item.maximum.toFixed(2),
    String(item.sendAt),
    String(item.limit),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderMetricViews(items: FallbackSenderMetric[]): FallbackSenderMetricView[] {
  const views: FallbackSenderMetricView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderMetricView(item));
  }
  return views;
}

export function sumFallbackSenderMetricView(view: FallbackSenderMetricView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedWeight + parsedMaximum + parsedSendAt;
}
