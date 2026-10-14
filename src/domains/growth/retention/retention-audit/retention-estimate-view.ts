import * as text from "../../../../kit/text.js";
import { RetentionEstimate } from "./retention-estimate.js";

/** How screens and exports show a retention estimate. */
export class RetentionEstimateView {
  codeText: string;
  label: string;
  ownerId: string;
  limitText: string;
  audienceId: string;
  currency: string;
  regionText: string;
  rate: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ownerId: string,
    limitText: string,
    audienceId: string,
    currency: string,
    regionText: string,
    rate: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ownerId = ownerId;
    this.limitText = limitText;
    this.audienceId = audienceId;
    this.currency = currency;
    this.regionText = regionText;
    this.rate = rate;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionEstimateView(item: RetentionEstimate): RetentionEstimateView {
  return new RetentionEstimateView(
    item.code,
    text.truncate(item.label, 64),
    text.truncate(item.ownerId, 120),
    String(item.limit),
    item.audienceId,
    item.currency,
    text.truncate(item.region, 64),
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionEstimateViews(items: RetentionEstimate[]): RetentionEstimateView[] {
  const views: RetentionEstimateView[] = [];
  for (const item of items) {
    views.push(toRetentionEstimateView(item));
  }
  return views;
}

export function sumRetentionEstimateView(view: RetentionEstimateView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedLimit + parsedRate + parsedBid;
}
