import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

/** How screens and exports show a fallback double opt in batch. */
export class FallbackDoubleOptInBatchView {
  codeText: string;
  titleText: string;
  priority: string;
  windowDays: string;
  costText: string;
  phoneText: string;
  conversionRateText: string;
  reviewerText: string;
  source: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    priority: string,
    windowDays: string,
    costText: string,
    phoneText: string,
    conversionRateText: string,
    reviewerText: string,
    source: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.priority = priority;
    this.windowDays = windowDays;
    this.costText = costText;
    this.phoneText = phoneText;
    this.conversionRateText = conversionRateText;
    this.reviewerText = reviewerText;
    this.source = source;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackDoubleOptInBatchView(item: FallbackDoubleOptInBatch): FallbackDoubleOptInBatchView {
  return new FallbackDoubleOptInBatchView(
    item.code,
    item.title,
    String(item.priority),
    String(item.windowDays),
    item.cost.toFixed(2),
    text.truncate(item.phone, 64),
    item.conversionRate.toFixed(2),
    item.reviewer,
    text.truncate(item.source, 64),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackDoubleOptInBatchViews(items: FallbackDoubleOptInBatch[]): FallbackDoubleOptInBatchView[] {
  const views: FallbackDoubleOptInBatchView[] = [];
  for (const item of items) {
    views.push(toFallbackDoubleOptInBatchView(item));
  }
  return views;
}

export function sumFallbackDoubleOptInBatchView(view: FallbackDoubleOptInBatchView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedPriority + parsedWindowDays + parsedCost;
}
