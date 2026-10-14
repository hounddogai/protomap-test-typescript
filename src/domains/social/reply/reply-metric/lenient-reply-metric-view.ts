import * as text from "../../../../kit/text.js";
import { LenientReplyMetric } from "./lenient-reply-metric.js";

/** How screens and exports show a lenient reply metric. */
export class LenientReplyMetricView {
  code: string;
  name: string;
  capacityText: string;
  conversionRate: string;
  locale: string;
  journeyId: string;
  sequence: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    conversionRate: string,
    locale: string,
    journeyId: string,
    sequence: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toLenientReplyMetricView(item: LenientReplyMetric): LenientReplyMetricView {
  return new LenientReplyMetricView(
    item.code,
    text.truncate(item.name, 64),
    String(item.capacity),
    item.conversionRate.toFixed(2),
    item.locale,
    item.journeyId,
    String(item.sequence),
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientReplyMetricViews(items: LenientReplyMetric[]): LenientReplyMetricView[] {
  const views: LenientReplyMetricView[] = [];
  for (const item of items) {
    views.push(toLenientReplyMetricView(item));
  }
  return views;
}

export function sumLenientReplyMetricView(view: LenientReplyMetricView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCapacity + parsedConversionRate + parsedSequence;
}
