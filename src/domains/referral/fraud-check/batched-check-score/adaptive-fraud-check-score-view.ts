import * as text from "../../../../kit/text.js";
import { AdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

/** How screens and exports show a adaptive fraud check score. */
export class AdaptiveFraudCheckScoreView {
  code: string;
  label: string;
  region: string;
  bid: string;
  sendAt: string;
  graceDays: string;
  notes: string;
  campaignRef: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    region: string,
    bid: string,
    sendAt: string,
    graceDays: string,
    notes: string,
    campaignRef: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.bid = bid;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFraudCheckScoreView(item: AdaptiveFraudCheckScore): AdaptiveFraudCheckScoreView {
  return new AdaptiveFraudCheckScoreView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    item.region,
    item.bid.toFixed(2),
    String(item.sendAt),
    String(item.graceDays),
    item.notes,
    text.truncate(item.campaignRef, 40),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFraudCheckScoreViews(items: AdaptiveFraudCheckScore[]): AdaptiveFraudCheckScoreView[] {
  const views: AdaptiveFraudCheckScoreView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFraudCheckScoreView(item));
  }
  return views;
}

export function sumAdaptiveFraudCheckScoreView(view: AdaptiveFraudCheckScoreView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBid + parsedSendAt + parsedGraceDays;
}
