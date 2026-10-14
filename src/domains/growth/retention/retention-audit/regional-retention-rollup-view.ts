import * as text from "../../../../kit/text.js";
import { RegionalRetentionRollup } from "./regional-retention-rollup.js";

/** How screens and exports show a regional retention rollup. */
export class RegionalRetentionRollupView {
  code: string;
  titleText: string;
  description: string;
  sendAt: string;
  bidText: string;
  summaryText: string;
  quantity: string;
  score: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    description: string,
    sendAt: string,
    bidText: string,
    summaryText: string,
    quantity: string,
    score: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.description = description;
    this.sendAt = sendAt;
    this.bidText = bidText;
    this.summaryText = summaryText;
    this.quantity = quantity;
    this.score = score;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRetentionRollupView(item: RegionalRetentionRollup): RegionalRetentionRollupView {
  return new RegionalRetentionRollupView(
    item.code,
    item.title,
    text.truncate(item.description, 120),
    String(item.sendAt),
    item.bid.toFixed(2),
    item.summary,
    String(item.quantity),
    item.score.toFixed(2),
    text.truncate(item.segment, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRetentionRollupViews(items: RegionalRetentionRollup[]): RegionalRetentionRollupView[] {
  const views: RegionalRetentionRollupView[] = [];
  for (const item of items) {
    views.push(toRegionalRetentionRollupView(item));
  }
  return views;
}

export function sumRegionalRetentionRollupView(view: RegionalRetentionRollupView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSendAt + parsedBid + parsedQuantity;
}
