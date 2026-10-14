import { DefaultMentionAdjustment } from "./default-mention-adjustment.js";

/** How screens and exports show a default mention adjustment. */
export class DefaultMentionAdjustmentView {
  code: string;
  titleText: string;
  bid: string;
  margin: string;
  checksumText: string;
  priority: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    bid: string,
    margin: string,
    checksumText: string,
    priority: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.bid = bid;
    this.margin = margin;
    this.checksumText = checksumText;
    this.priority = priority;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMentionAdjustmentView(item: DefaultMentionAdjustment): DefaultMentionAdjustmentView {
  return new DefaultMentionAdjustmentView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.margin.toFixed(2),
    item.checksum,
    String(item.priority),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMentionAdjustmentViews(items: DefaultMentionAdjustment[]): DefaultMentionAdjustmentView[] {
  const views: DefaultMentionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toDefaultMentionAdjustmentView(item));
  }
  return views;
}

export function sumDefaultMentionAdjustmentView(view: DefaultMentionAdjustmentView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBid + parsedMargin + parsedPriority;
}
