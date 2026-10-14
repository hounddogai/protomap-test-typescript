import * as text from "../../../../kit/text.js";
import { WeightedPayoutSegment } from "./weighted-payout-segment.js";

/** How screens and exports show a weighted payout segment. */
export class WeightedPayoutSegmentView {
  codeText: string;
  titleText: string;
  updatedAt: string;
  priorityText: string;
  segmentText: string;
  checksum: string;
  graceDays: string;
  bid: string;
  sendAt: string;
  revision: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    updatedAt: string,
    priorityText: string,
    segmentText: string,
    checksum: string,
    graceDays: string,
    bid: string,
    sendAt: string,
    revision: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.priorityText = priorityText;
    this.segmentText = segmentText;
    this.checksum = checksum;
    this.graceDays = graceDays;
    this.bid = bid;
    this.sendAt = sendAt;
    this.revision = revision;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPayoutSegmentView(item: WeightedPayoutSegment): WeightedPayoutSegmentView {
  return new WeightedPayoutSegmentView(
    item.code,
    item.title,
    String(item.updatedAt),
    String(item.priority),
    item.segment,
    text.truncate(item.checksum, 40),
    String(item.graceDays),
    item.bid.toFixed(2),
    String(item.sendAt),
    String(item.revision),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPayoutSegmentViews(items: WeightedPayoutSegment[]): WeightedPayoutSegmentView[] {
  const views: WeightedPayoutSegmentView[] = [];
  for (const item of items) {
    views.push(toWeightedPayoutSegmentView(item));
  }
  return views;
}

export function sumWeightedPayoutSegmentView(view: WeightedPayoutSegmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedUpdatedAt + parsedPriority + parsedGraceDays;
}
