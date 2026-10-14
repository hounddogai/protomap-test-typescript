import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

/** How screens and exports show a scheduled deflection metric. */
export class ScheduledDeflectionMetricView {
  codeText: string;
  labelText: string;
  audienceIdText: string;
  capacity: string;
  ratio: string;
  endsAt: string;
  priority: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    audienceIdText: string,
    capacity: string,
    ratio: string,
    endsAt: string,
    priority: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.audienceIdText = audienceIdText;
    this.capacity = capacity;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.priority = priority;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDeflectionMetricView(item: ScheduledDeflectionMetric): ScheduledDeflectionMetricView {
  return new ScheduledDeflectionMetricView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.audienceId, 80),
    String(item.capacity),
    item.ratio.toFixed(2),
    String(item.endsAt),
    String(item.priority),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDeflectionMetricViews(items: ScheduledDeflectionMetric[]): ScheduledDeflectionMetricView[] {
  const views: ScheduledDeflectionMetricView[] = [];
  for (const item of items) {
    views.push(toScheduledDeflectionMetricView(item));
  }
  return views;
}

export function sumScheduledDeflectionMetricView(view: ScheduledDeflectionMetricView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCapacity + parsedRatio + parsedEndsAt;
}
