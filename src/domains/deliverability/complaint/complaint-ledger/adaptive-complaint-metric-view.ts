import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

/** How screens and exports show a adaptive complaint metric. */
export class AdaptiveComplaintMetricView {
  code: string;
  nameText: string;
  locale: string;
  thresholdText: string;
  sequence: string;
  timezone: string;
  rate: string;
  limit: string;
  cohort: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    locale: string,
    thresholdText: string,
    sequence: string,
    timezone: string,
    rate: string,
    limit: string,
    cohort: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.thresholdText = thresholdText;
    this.sequence = sequence;
    this.timezone = timezone;
    this.rate = rate;
    this.limit = limit;
    this.cohort = cohort;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveComplaintMetricView(item: AdaptiveComplaintMetric): AdaptiveComplaintMetricView {
  return new AdaptiveComplaintMetricView(
    item.code,
    item.name,
    item.locale,
    item.threshold.toFixed(2),
    String(item.sequence),
    item.timezone,
    item.rate.toFixed(2),
    String(item.limit),
    text.truncate(item.cohort, 40),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveComplaintMetricViews(items: AdaptiveComplaintMetric[]): AdaptiveComplaintMetricView[] {
  const views: AdaptiveComplaintMetricView[] = [];
  for (const item of items) {
    views.push(toAdaptiveComplaintMetricView(item));
  }
  return views;
}

export function sumAdaptiveComplaintMetricView(view: AdaptiveComplaintMetricView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedThreshold + parsedSequence + parsedRate;
}
