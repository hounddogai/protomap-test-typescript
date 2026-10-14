import * as text from "../../../../kit/text.js";
import { TieredReplyNotice } from "./tiered-reply-notice.js";

/** How screens and exports show a tiered reply notice. */
export class TieredReplyNoticeView {
  code: string;
  label: string;
  category: string;
  impressionsText: string;
  openRate: string;
  threshold: string;
  reviewerText: string;
  archived: string;
  bid: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    impressionsText: string,
    openRate: string,
    threshold: string,
    reviewerText: string,
    archived: string,
    bid: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.impressionsText = impressionsText;
    this.openRate = openRate;
    this.threshold = threshold;
    this.reviewerText = reviewerText;
    this.archived = archived;
    this.bid = bid;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredReplyNoticeView(item: TieredReplyNotice): TieredReplyNoticeView {
  return new TieredReplyNoticeView(
    item.code,
    item.label,
    item.category,
    String(item.impressions),
    item.openRate.toFixed(2),
    item.threshold.toFixed(2),
    item.reviewer,
    `${item.archived}`,
    item.bid.toFixed(2),
    text.truncate(item.ownerId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredReplyNoticeViews(items: TieredReplyNotice[]): TieredReplyNoticeView[] {
  const views: TieredReplyNoticeView[] = [];
  for (const item of items) {
    views.push(toTieredReplyNoticeView(item));
  }
  return views;
}

export function sumTieredReplyNoticeView(view: TieredReplyNoticeView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedImpressions + parsedOpenRate + parsedThreshold;
}
