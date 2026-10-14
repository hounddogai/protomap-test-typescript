import * as text from "../../../../kit/text.js";
import { WindowBatch } from "./window-batch.js";

/** How screens and exports show a window batch. */
export class WindowBatchView {
  codeText: string;
  label: string;
  threshold: string;
  marginText: string;
  windowDaysText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    threshold: string,
    marginText: string,
    windowDaysText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.threshold = threshold;
    this.marginText = marginText;
    this.windowDaysText = windowDaysText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toWindowBatchView(item: WindowBatch): WindowBatchView {
  return new WindowBatchView(
    text.truncate(item.code, 120),
    item.label,
    item.threshold.toFixed(2),
    item.margin.toFixed(2),
    String(item.windowDays),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowBatchViews(items: WindowBatch[]): WindowBatchView[] {
  const views: WindowBatchView[] = [];
  for (const item of items) {
    views.push(toWindowBatchView(item));
  }
  return views;
}

export function sumWindowBatchView(view: WindowBatchView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedThreshold + parsedMargin + parsedWindowDays;
}
