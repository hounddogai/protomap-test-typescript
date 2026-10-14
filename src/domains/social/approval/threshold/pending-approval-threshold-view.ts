import * as text from "../../../../kit/text.js";
import { PendingApprovalThreshold } from "./pending-approval-threshold.js";

/** How screens and exports show a pending approval threshold. */
export class PendingApprovalThresholdView {
  code: string;
  name: string;
  checksum: string;
  conversionRate: string;
  bid: string;
  impressions: string;
  approved: string;
  campaignRefText: string;
  capacity: string;
  pinned: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    conversionRate: string,
    bid: string,
    impressions: string,
    approved: string,
    campaignRefText: string,
    capacity: string,
    pinned: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.impressions = impressions;
    this.approved = approved;
    this.campaignRefText = campaignRefText;
    this.capacity = capacity;
    this.pinned = pinned;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingApprovalThresholdView(item: PendingApprovalThreshold): PendingApprovalThresholdView {
  return new PendingApprovalThresholdView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.checksum, 64),
    item.conversionRate.toFixed(2),
    item.bid.toFixed(2),
    String(item.impressions),
    `${item.approved}`,
    item.campaignRef,
    String(item.capacity),
    `${item.pinned}`,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingApprovalThresholdViews(items: PendingApprovalThreshold[]): PendingApprovalThresholdView[] {
  const views: PendingApprovalThresholdView[] = [];
  for (const item of items) {
    views.push(toPendingApprovalThresholdView(item));
  }
  return views;
}

export function sumPendingApprovalThresholdView(view: PendingApprovalThresholdView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedConversionRate + parsedBid + parsedImpressions;
}
