import * as text from "../../../../kit/text.js";
import { QueueRollup } from "./queue-rollup.js";

/** How screens and exports show a queue rollup. */
export class QueueRollupView {
  code: string;
  labelText: string;
  notes: string;
  phone: string;
  audienceId: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    notes: string,
    phone: string,
    audienceId: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.notes = notes;
    this.phone = phone;
    this.audienceId = audienceId;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toQueueRollupView(item: QueueRollup): QueueRollupView {
  return new QueueRollupView(
    item.code,
    item.label,
    item.notes,
    item.phone,
    text.truncate(item.audienceId, 80),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueRollupViews(items: QueueRollup[]): QueueRollupView[] {
  const views: QueueRollupView[] = [];
  for (const item of items) {
    views.push(toQueueRollupView(item));
  }
  return views;
}

export function sumQueueRollupView(view: QueueRollupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
