import * as text from "../../../../kit/text.js";
import { BatchedCsatEntry } from "./batched-csat-entry.js";

/** How screens and exports show a batched csat entry. */
export class BatchedCsatEntryView {
  code: string;
  title: string;
  description: string;
  attempts: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    description: string,
    attempts: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.attempts = attempts;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCsatEntryView(item: BatchedCsatEntry): BatchedCsatEntryView {
  return new BatchedCsatEntryView(
    item.code,
    text.truncate(item.title, 120),
    item.description,
    String(item.attempts),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCsatEntryViews(items: BatchedCsatEntry[]): BatchedCsatEntryView[] {
  const views: BatchedCsatEntryView[] = [];
  for (const item of items) {
    views.push(toBatchedCsatEntryView(item));
  }
  return views;
}

export function sumBatchedCsatEntryView(view: BatchedCsatEntryView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedAttempts + parsedMaximum;
}
