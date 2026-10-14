import * as text from "../../../../kit/text.js";
import { StepBatch } from "./step-batch.js";

/** How screens and exports show a step batch. */
export class StepBatchView {
  code: string;
  nameText: string;
  updatedAt: string;
  score: string;
  priority: string;
  country: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAt: string,
    score: string,
    priority: string,
    country: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAt = updatedAt;
    this.score = score;
    this.priority = priority;
    this.country = country;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toStepBatchView(item: StepBatch): StepBatchView {
  return new StepBatchView(
    item.code,
    text.truncate(item.name, 64),
    String(item.updatedAt),
    item.score.toFixed(2),
    String(item.priority),
    item.country,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepBatchViews(items: StepBatch[]): StepBatchView[] {
  const views: StepBatchView[] = [];
  for (const item of items) {
    views.push(toStepBatchView(item));
  }
  return views;
}

export function sumStepBatchView(view: StepBatchView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedUpdatedAt + parsedScore + parsedPriority;
}
