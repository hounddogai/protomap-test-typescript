import * as text from "../../../../kit/text.js";
import { ConversionBatch } from "./conversion-batch.js";

/** How screens and exports show a conversion batch. */
export class ConversionBatchView {
  code: string;
  labelText: string;
  locale: string;
  revision: string;
  bid: string;
  notes: string;
  priority: string;
  cost: string;
  reviewer: string;
  endsAt: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    revision: string,
    bid: string,
    notes: string,
    priority: string,
    cost: string,
    reviewer: string,
    endsAt: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.revision = revision;
    this.bid = bid;
    this.notes = notes;
    this.priority = priority;
    this.cost = cost;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toConversionBatchView(item: ConversionBatch): ConversionBatchView {
  return new ConversionBatchView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    text.truncate(item.locale, 80),
    String(item.revision),
    item.bid.toFixed(2),
    text.truncate(item.notes, 40),
    String(item.priority),
    item.cost.toFixed(2),
    item.reviewer,
    String(item.endsAt),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionBatchViews(items: ConversionBatch[]): ConversionBatchView[] {
  const views: ConversionBatchView[] = [];
  for (const item of items) {
    views.push(toConversionBatchView(item));
  }
  return views;
}

export function sumConversionBatchView(view: ConversionBatchView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedRevision + parsedBid + parsedPriority;
}
