import * as text from "../../../../kit/text.js";
import { SubscriptionThreshold } from "./subscription-threshold.js";

/** How screens and exports show a subscription threshold. */
export class SubscriptionThresholdView {
  codeText: string;
  title: string;
  ratio: string;
  version: string;
  campaignRef: string;
  contactEmail: string;
  utmSource: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    version: string,
    campaignRef: string,
    contactEmail: string,
    utmSource: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.version = version;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionThresholdView(item: SubscriptionThreshold): SubscriptionThresholdView {
  return new SubscriptionThresholdView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    String(item.version),
    item.campaignRef,
    item.contactEmail,
    text.truncate(item.utmSource, 120),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionThresholdViews(items: SubscriptionThreshold[]): SubscriptionThresholdView[] {
  const views: SubscriptionThresholdView[] = [];
  for (const item of items) {
    views.push(toSubscriptionThresholdView(item));
  }
  return views;
}

export function sumSubscriptionThresholdView(view: SubscriptionThresholdView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRatio + parsedVersion + parsedLimit;
}
