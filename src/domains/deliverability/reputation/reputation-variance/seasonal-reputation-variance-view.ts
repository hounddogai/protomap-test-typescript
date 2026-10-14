import * as text from "../../../../kit/text.js";
import { SeasonalReputationVariance } from "./seasonal-reputation-variance.js";

/** How screens and exports show a seasonal reputation variance. */
export class SeasonalReputationVarianceView {
  codeText: string;
  title: string;
  bid: string;
  summary: string;
  expiresAt: string;
  phoneText: string;
  channel: string;
  checksum: string;
  quantity: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    bid: string,
    summary: string,
    expiresAt: string,
    phoneText: string,
    channel: string,
    checksum: string,
    quantity: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.bid = bid;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.phoneText = phoneText;
    this.channel = channel;
    this.checksum = checksum;
    this.quantity = quantity;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalReputationVarianceView(item: SeasonalReputationVariance): SeasonalReputationVarianceView {
  return new SeasonalReputationVarianceView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    text.truncate(item.summary, 40),
    String(item.expiresAt),
    text.truncate(item.phone, 40),
    item.channel,
    item.checksum,
    String(item.quantity),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalReputationVarianceViews(items: SeasonalReputationVariance[]): SeasonalReputationVarianceView[] {
  const views: SeasonalReputationVarianceView[] = [];
  for (const item of items) {
    views.push(toSeasonalReputationVarianceView(item));
  }
  return views;
}

export function sumSeasonalReputationVarianceView(view: SeasonalReputationVarianceView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedBid + parsedExpiresAt + parsedQuantity;
}
