import * as text from "../../../../kit/text.js";
import { LenientQueueEntry } from "./lenient-queue-entry.js";

/** How screens and exports show a lenient queue entry. */
export class LenientQueueEntryView {
  code: string;
  name: string;
  quantityText: string;
  segment: string;
  activeText: string;
  windowDaysText: string;
  batchSizeText: string;
  labelText: string;
  notes: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantityText: string,
    segment: string,
    activeText: string,
    windowDaysText: string,
    batchSizeText: string,
    labelText: string,
    notes: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantityText = quantityText;
    this.segment = segment;
    this.activeText = activeText;
    this.windowDaysText = windowDaysText;
    this.batchSizeText = batchSizeText;
    this.labelText = labelText;
    this.notes = notes;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLenientQueueEntryView(item: LenientQueueEntry): LenientQueueEntryView {
  return new LenientQueueEntryView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    String(item.quantity),
    item.segment,
    `${item.active}`,
    String(item.windowDays),
    String(item.batchSize),
    item.label,
    text.truncate(item.notes, 64),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientQueueEntryViews(items: LenientQueueEntry[]): LenientQueueEntryView[] {
  const views: LenientQueueEntryView[] = [];
  for (const item of items) {
    views.push(toLenientQueueEntryView(item));
  }
  return views;
}

export function sumLenientQueueEntryView(view: LenientQueueEntryView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedQuantity + parsedWindowDays + parsedBatchSize;
}
