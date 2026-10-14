import * as text from "../../../../kit/text.js";
import { OptOutQuota } from "./opt-out-quota.js";

/** How screens and exports show a opt out quota. */
export class OptOutQuotaView {
  code: string;
  titleText: string;
  version: string;
  utmSource: string;
  bid: string;
  contactEmailText: string;
  impressions: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    version: string,
    utmSource: string,
    bid: string,
    contactEmailText: string,
    impressions: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.version = version;
    this.utmSource = utmSource;
    this.bid = bid;
    this.contactEmailText = contactEmailText;
    this.impressions = impressions;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutQuotaView(item: OptOutQuota): OptOutQuotaView {
  return new OptOutQuotaView(
    text.truncate(item.code, 120),
    item.title,
    String(item.version),
    item.utmSource,
    item.bid.toFixed(2),
    item.contactEmail,
    String(item.impressions),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutQuotaViews(items: OptOutQuota[]): OptOutQuotaView[] {
  const views: OptOutQuotaView[] = [];
  for (const item of items) {
    views.push(toOptOutQuotaView(item));
  }
  return views;
}

export function sumOptOutQuotaView(view: OptOutQuotaView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedVersion + parsedBid + parsedImpressions;
}
