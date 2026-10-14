import * as text from "../../../../kit/text.js";
import { StrictWaitMetric } from "./strict-wait-metric.js";

/** How screens and exports show a strict wait metric. */
export class StrictWaitMetricView {
  code: string;
  nameText: string;
  checksum: string;
  pinned: string;
  expiresAtText: string;
  priority: string;
  graceDays: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    checksum: string,
    pinned: string,
    expiresAtText: string,
    priority: string,
    graceDays: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.checksum = checksum;
    this.pinned = pinned;
    this.expiresAtText = expiresAtText;
    this.priority = priority;
    this.graceDays = graceDays;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWaitMetricView(item: StrictWaitMetric): StrictWaitMetricView {
  return new StrictWaitMetricView(
    item.code,
    item.name,
    item.checksum,
    `${item.pinned}`,
    String(item.expiresAt),
    String(item.priority),
    String(item.graceDays),
    text.truncate(item.segment, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWaitMetricViews(items: StrictWaitMetric[]): StrictWaitMetricView[] {
  const views: StrictWaitMetricView[] = [];
  for (const item of items) {
    views.push(toStrictWaitMetricView(item));
  }
  return views;
}

export function sumStrictWaitMetricView(view: StrictWaitMetricView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedExpiresAt + parsedPriority + parsedGraceDays;
}
