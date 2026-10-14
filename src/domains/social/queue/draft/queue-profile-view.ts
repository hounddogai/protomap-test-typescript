import * as text from "../../../../kit/text.js";
import { QueueProfile } from "./queue-profile.js";

/** How screens and exports show a queue profile. */
export class QueueProfileView {
  codeText: string;
  title: string;
  ceiling: string;
  score: string;
  audienceIdText: string;
  sequenceText: string;
  limit: string;
  margin: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ceiling: string,
    score: string,
    audienceIdText: string,
    sequenceText: string,
    limit: string,
    margin: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ceiling = ceiling;
    this.score = score;
    this.audienceIdText = audienceIdText;
    this.sequenceText = sequenceText;
    this.limit = limit;
    this.margin = margin;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toQueueProfileView(item: QueueProfile): QueueProfileView {
  return new QueueProfileView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.audienceId, 40),
    String(item.sequence),
    String(item.limit),
    item.margin.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueProfileViews(items: QueueProfile[]): QueueProfileView[] {
  const views: QueueProfileView[] = [];
  for (const item of items) {
    views.push(toQueueProfileView(item));
  }
  return views;
}

export function sumQueueProfileView(view: QueueProfileView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedCeiling + parsedScore + parsedSequence;
}
