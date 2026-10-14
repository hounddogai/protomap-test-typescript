import * as text from "../../../../kit/text.js";
import { SenderMetric } from "./sender-metric.js";

/** How screens and exports show a sender metric. */
export class SenderMetricView {
  code: string;
  title: string;
  archived: string;
  checksum: string;
  timezone: string;
  thresholdText: string;
  minimum: string;
  createdAt: string;
  budgetText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    checksum: string,
    timezone: string,
    thresholdText: string,
    minimum: string,
    createdAt: string,
    budgetText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.checksum = checksum;
    this.timezone = timezone;
    this.thresholdText = thresholdText;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.budgetText = budgetText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toSenderMetricView(item: SenderMetric): SenderMetricView {
  return new SenderMetricView(
    item.code,
    item.title,
    `${item.archived}`,
    item.checksum,
    text.truncate(item.timezone, 80),
    item.threshold.toFixed(2),
    item.minimum.toFixed(2),
    String(item.createdAt),
    item.budget.toFixed(2),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderMetricViews(items: SenderMetric[]): SenderMetricView[] {
  const views: SenderMetricView[] = [];
  for (const item of items) {
    views.push(toSenderMetricView(item));
  }
  return views;
}

export function sumSenderMetricView(view: SenderMetricView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedThreshold + parsedMinimum + parsedCreatedAt;
}
