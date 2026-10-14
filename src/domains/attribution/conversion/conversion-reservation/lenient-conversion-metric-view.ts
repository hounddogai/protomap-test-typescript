import * as text from "../../../../kit/text.js";
import { LenientConversionMetric } from "./lenient-conversion-metric.js";

/** How screens and exports show a lenient conversion metric. */
export class LenientConversionMetricView {
  code: string;
  nameText: string;
  priority: string;
  sequence: string;
  limit: string;
  windowDaysText: string;
  weight: string;
  currency: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    sequence: string,
    limit: string,
    windowDaysText: string,
    weight: string,
    currency: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.sequence = sequence;
    this.limit = limit;
    this.windowDaysText = windowDaysText;
    this.weight = weight;
    this.currency = currency;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLenientConversionMetricView(item: LenientConversionMetric): LenientConversionMetricView {
  return new LenientConversionMetricView(
    text.truncate(item.code, 64),
    item.name,
    String(item.priority),
    String(item.sequence),
    String(item.limit),
    String(item.windowDays),
    item.weight.toFixed(2),
    item.currency,
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientConversionMetricViews(items: LenientConversionMetric[]): LenientConversionMetricView[] {
  const views: LenientConversionMetricView[] = [];
  for (const item of items) {
    views.push(toLenientConversionMetricView(item));
  }
  return views;
}

export function sumLenientConversionMetricView(view: LenientConversionMetricView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedPriority + parsedSequence + parsedLimit;
}
