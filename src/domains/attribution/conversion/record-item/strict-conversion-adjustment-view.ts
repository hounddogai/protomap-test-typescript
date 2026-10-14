import * as text from "../../../../kit/text.js";
import { StrictConversionAdjustment } from "./strict-conversion-adjustment.js";

/** How screens and exports show a strict conversion adjustment. */
export class StrictConversionAdjustmentView {
  code: string;
  label: string;
  contactEmail: string;
  updatedAt: string;
  utmSource: string;
  threshold: string;
  openRateText: string;
  retries: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    updatedAt: string,
    utmSource: string,
    threshold: string,
    openRateText: string,
    retries: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.threshold = threshold;
    this.openRateText = openRateText;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toStrictConversionAdjustmentView(item: StrictConversionAdjustment): StrictConversionAdjustmentView {
  return new StrictConversionAdjustmentView(
    item.code,
    item.label,
    item.contactEmail,
    String(item.updatedAt),
    text.truncate(item.utmSource, 120),
    item.threshold.toFixed(2),
    item.openRate.toFixed(2),
    String(item.retries),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictConversionAdjustmentViews(items: StrictConversionAdjustment[]): StrictConversionAdjustmentView[] {
  const views: StrictConversionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictConversionAdjustmentView(item));
  }
  return views;
}

export function sumStrictConversionAdjustmentView(view: StrictConversionAdjustmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedUpdatedAt + parsedThreshold + parsedOpenRate;
}
