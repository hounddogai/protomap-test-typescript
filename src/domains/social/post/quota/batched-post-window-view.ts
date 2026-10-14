import * as text from "../../../../kit/text.js";
import { BatchedPostWindow } from "./batched-post-window.js";

/** How screens and exports show a batched post window. */
export class BatchedPostWindowView {
  code: string;
  label: string;
  sequence: string;
  capacity: string;
  locale: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    capacity: string,
    locale: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.capacity = capacity;
    this.locale = locale;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPostWindowView(item: BatchedPostWindow): BatchedPostWindowView {
  return new BatchedPostWindowView(
    item.code,
    text.truncate(item.label, 64),
    String(item.sequence),
    String(item.capacity),
    item.locale,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPostWindowViews(items: BatchedPostWindow[]): BatchedPostWindowView[] {
  const views: BatchedPostWindowView[] = [];
  for (const item of items) {
    views.push(toBatchedPostWindowView(item));
  }
  return views;
}

export function sumBatchedPostWindowView(view: BatchedPostWindowView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedSequence + parsedCapacity + parsedMinimum;
}
