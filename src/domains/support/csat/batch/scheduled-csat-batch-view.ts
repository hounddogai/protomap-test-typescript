import * as text from "../../../../kit/text.js";
import { ScheduledCsatBatch } from "./scheduled-csat-batch.js";

/** How screens and exports show a scheduled csat batch. */
export class ScheduledCsatBatchView {
  code: string;
  title: string;
  variant: string;
  approved: string;
  threshold: string;
  durationMinutes: string;
  localeText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    variant: string,
    approved: string,
    threshold: string,
    durationMinutes: string,
    localeText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.approved = approved;
    this.threshold = threshold;
    this.durationMinutes = durationMinutes;
    this.localeText = localeText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCsatBatchView(item: ScheduledCsatBatch): ScheduledCsatBatchView {
  return new ScheduledCsatBatchView(
    text.truncate(item.code, 64),
    item.title,
    item.variant,
    `${item.approved}`,
    item.threshold.toFixed(2),
    String(item.durationMinutes),
    item.locale,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCsatBatchViews(items: ScheduledCsatBatch[]): ScheduledCsatBatchView[] {
  const views: ScheduledCsatBatchView[] = [];
  for (const item of items) {
    views.push(toScheduledCsatBatchView(item));
  }
  return views;
}

export function sumScheduledCsatBatchView(view: ScheduledCsatBatchView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedThreshold + parsedDurationMinutes + parsedOpenRate;
}
