import * as text from "../../../../kit/text.js";
import { SeasonalPaywallNotice } from "./seasonal-paywall-notice.js";

/** How screens and exports show a seasonal paywall notice. */
export class SeasonalPaywallNoticeView {
  code: string;
  label: string;
  minimum: string;
  contactEmail: string;
  region: string;
  reviewer: string;
  floorValue: string;
  ownerId: string;
  batchSizeText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    contactEmail: string,
    region: string,
    reviewer: string,
    floorValue: string,
    ownerId: string,
    batchSizeText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.region = region;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.batchSizeText = batchSizeText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPaywallNoticeView(item: SeasonalPaywallNotice): SeasonalPaywallNoticeView {
  return new SeasonalPaywallNoticeView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.contactEmail,
    item.region,
    text.truncate(item.reviewer, 120),
    item.floorValue.toFixed(2),
    item.ownerId,
    String(item.batchSize),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPaywallNoticeViews(items: SeasonalPaywallNotice[]): SeasonalPaywallNoticeView[] {
  const views: SeasonalPaywallNoticeView[] = [];
  for (const item of items) {
    views.push(toSeasonalPaywallNoticeView(item));
  }
  return views;
}

export function sumSeasonalPaywallNoticeView(view: SeasonalPaywallNoticeView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedMinimum + parsedFloorValue + parsedBatchSize;
}
