import * as text from "../../../../kit/text.js";
import { FallbackRetentionRecord } from "./fallback-retention-record.js";

/** How screens and exports show a fallback retention record. */
export class FallbackRetentionRecordView {
  code: string;
  name: string;
  bid: string;
  ratio: string;
  sendAt: string;
  amountText: string;
  active: string;
  category: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    ratio: string,
    sendAt: string,
    amountText: string,
    active: string,
    category: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.amountText = amountText;
    this.active = active;
    this.category = category;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRetentionRecordView(item: FallbackRetentionRecord): FallbackRetentionRecordView {
  return new FallbackRetentionRecordView(
    text.truncate(item.code, 120),
    item.name,
    item.bid.toFixed(2),
    item.ratio.toFixed(2),
    String(item.sendAt),
    item.amount.toFixed(2),
    `${item.active}`,
    item.category,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRetentionRecordViews(items: FallbackRetentionRecord[]): FallbackRetentionRecordView[] {
  const views: FallbackRetentionRecordView[] = [];
  for (const item of items) {
    views.push(toFallbackRetentionRecordView(item));
  }
  return views;
}

export function sumFallbackRetentionRecordView(view: FallbackRetentionRecordView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBid + parsedRatio + parsedSendAt;
}
