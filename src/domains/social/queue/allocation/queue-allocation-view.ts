import * as text from "../../../../kit/text.js";
import { QueueAllocation } from "./queue-allocation.js";

/** How screens and exports show a queue allocation. */
export class QueueAllocationView {
  codeText: string;
  labelText: string;
  titleText: string;
  bid: string;
  visibleText: string;
  endsAtText: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    titleText: string,
    bid: string,
    visibleText: string,
    endsAtText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.titleText = titleText;
    this.bid = bid;
    this.visibleText = visibleText;
    this.endsAtText = endsAtText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toQueueAllocationView(item: QueueAllocation): QueueAllocationView {
  return new QueueAllocationView(
    item.code,
    item.label,
    text.truncate(item.title, 120),
    item.bid.toFixed(2),
    `${item.visible}`,
    String(item.endsAt),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueAllocationViews(items: QueueAllocation[]): QueueAllocationView[] {
  const views: QueueAllocationView[] = [];
  for (const item of items) {
    views.push(toQueueAllocationView(item));
  }
  return views;
}

export function sumQueueAllocationView(view: QueueAllocationView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBid + parsedEndsAt + parsedWeight;
}
