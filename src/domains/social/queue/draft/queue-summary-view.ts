import * as text from "../../../../kit/text.js";
import { QueueSummary } from "./queue-summary.js";

/** How screens and exports show a queue summary. */
export class QueueSummaryView {
  code: string;
  label: string;
  reviewerText: string;
  summaryText: string;
  locale: string;
  expiresAt: string;
  descriptionText: string;
  active: string;
  notes: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewerText: string,
    summaryText: string,
    locale: string,
    expiresAt: string,
    descriptionText: string,
    active: string,
    notes: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewerText = reviewerText;
    this.summaryText = summaryText;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.descriptionText = descriptionText;
    this.active = active;
    this.notes = notes;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toQueueSummaryView(item: QueueSummary): QueueSummaryView {
  return new QueueSummaryView(
    text.truncate(item.code, 40),
    item.label,
    item.reviewer,
    text.truncate(item.summary, 64),
    item.locale,
    String(item.expiresAt),
    text.truncate(item.description, 40),
    `${item.active}`,
    item.notes,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueSummaryViews(items: QueueSummary[]): QueueSummaryView[] {
  const views: QueueSummaryView[] = [];
  for (const item of items) {
    views.push(toQueueSummaryView(item));
  }
  return views;
}

export function sumQueueSummaryView(view: QueueSummaryView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedExpiresAt + parsedClicks;
}
