import * as text from "../../../../kit/text.js";
import { ScheduledWindowBatch } from "./scheduled-window-batch.js";

/** How screens and exports show a scheduled window batch. */
export class ScheduledWindowBatchView {
  code: string;
  label: string;
  score: string;
  externalRefText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    externalRefText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.externalRefText = externalRefText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWindowBatchView(item: ScheduledWindowBatch): ScheduledWindowBatchView {
  return new ScheduledWindowBatchView(
    item.code,
    item.label,
    item.score.toFixed(2),
    item.externalRef,
    text.truncate(item.unit, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWindowBatchViews(items: ScheduledWindowBatch[]): ScheduledWindowBatchView[] {
  const views: ScheduledWindowBatchView[] = [];
  for (const item of items) {
    views.push(toScheduledWindowBatchView(item));
  }
  return views;
}

export function sumScheduledWindowBatchView(view: ScheduledWindowBatchView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
