import { BatchedModelEntry } from "./batched-model-entry.js";

/** How screens and exports show a batched model entry. */
export class BatchedModelEntryView {
  codeText: string;
  title: string;
  timezoneText: string;
  amountText: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezoneText: string,
    amountText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezoneText = timezoneText;
    this.amountText = amountText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedModelEntryView(item: BatchedModelEntry): BatchedModelEntryView {
  return new BatchedModelEntryView(
    item.code,
    item.title,
    item.timezone,
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedModelEntryViews(items: BatchedModelEntry[]): BatchedModelEntryView[] {
  const views: BatchedModelEntryView[] = [];
  for (const item of items) {
    views.push(toBatchedModelEntryView(item));
  }
  return views;
}

export function sumBatchedModelEntryView(view: BatchedModelEntryView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedAmount + parsedBid;
}
