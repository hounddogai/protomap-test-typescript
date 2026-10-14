import * as text from "../../../../kit/text.js";
import { RegionalSenderBundle } from "./regional-sender-bundle.js";

/** How screens and exports show a regional sender bundle. */
export class RegionalSenderBundleView {
  codeText: string;
  labelText: string;
  conversionRate: string;
  clicks: string;
  source: string;
  ownerId: string;
  locale: string;
  expiresAt: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    conversionRate: string,
    clicks: string,
    source: string,
    ownerId: string,
    locale: string,
    expiresAt: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.source = source;
    this.ownerId = ownerId;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSenderBundleView(item: RegionalSenderBundle): RegionalSenderBundleView {
  return new RegionalSenderBundleView(
    text.truncate(item.code, 40),
    item.label,
    item.conversionRate.toFixed(2),
    String(item.clicks),
    text.truncate(item.source, 120),
    item.ownerId,
    item.locale,
    String(item.expiresAt),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSenderBundleViews(items: RegionalSenderBundle[]): RegionalSenderBundleView[] {
  const views: RegionalSenderBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalSenderBundleView(item));
  }
  return views;
}

export function sumRegionalSenderBundleView(view: RegionalSenderBundleView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedConversionRate + parsedClicks + parsedExpiresAt;
}
