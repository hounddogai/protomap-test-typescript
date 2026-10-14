import * as text from "../../../../kit/text.js";
import { BatchedApprovalQuota } from "./batched-approval-quota.js";

/** How screens and exports show a batched approval quota. */
export class BatchedApprovalQuotaView {
  code: string;
  titleText: string;
  channelText: string;
  bid: string;
  campaignRef: string;
  variant: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channelText: string,
    bid: string,
    campaignRef: string,
    variant: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channelText = channelText;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedApprovalQuotaView(item: BatchedApprovalQuota): BatchedApprovalQuotaView {
  return new BatchedApprovalQuotaView(
    text.truncate(item.code, 80),
    item.title,
    item.channel,
    item.bid.toFixed(2),
    text.truncate(item.campaignRef, 40),
    text.truncate(item.variant, 64),
    text.truncate(item.country, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedApprovalQuotaViews(items: BatchedApprovalQuota[]): BatchedApprovalQuotaView[] {
  const views: BatchedApprovalQuotaView[] = [];
  for (const item of items) {
    views.push(toBatchedApprovalQuotaView(item));
  }
  return views;
}

export function sumBatchedApprovalQuotaView(view: BatchedApprovalQuotaView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
