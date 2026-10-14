import * as text from "../../../../kit/text.js";
import { ScheduledQueueEstimate } from "./scheduled-queue-estimate.js";

/** How screens and exports show a scheduled queue estimate. */
export class ScheduledQueueEstimateView {
  code: string;
  name: string;
  notes: string;
  score: string;
  ratio: string;
  statusLabel: string;

  constructor(code: string, name: string, notes: string, score: string, ratio: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.score = score;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledQueueEstimateView(item: ScheduledQueueEstimate): ScheduledQueueEstimateView {
  return new ScheduledQueueEstimateView(
    item.code,
    text.truncate(item.name, 40),
    item.notes,
    item.score.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledQueueEstimateViews(items: ScheduledQueueEstimate[]): ScheduledQueueEstimateView[] {
  const views: ScheduledQueueEstimateView[] = [];
  for (const item of items) {
    views.push(toScheduledQueueEstimateView(item));
  }
  return views;
}

export function sumScheduledQueueEstimateView(view: ScheduledQueueEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedScore + parsedRatio;
}
