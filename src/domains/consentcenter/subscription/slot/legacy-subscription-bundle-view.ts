import * as text from "../../../../kit/text.js";
import { LegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

/** How screens and exports show a legacy subscription bundle. */
export class LegacySubscriptionBundleView {
  codeText: string;
  title: string;
  unitText: string;
  conversionRate: string;
  locale: string;
  discount: string;
  notes: string;
  impressions: string;
  summaryText: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    unitText: string,
    conversionRate: string,
    locale: string,
    discount: string,
    notes: string,
    impressions: string,
    summaryText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.unitText = unitText;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.discount = discount;
    this.notes = notes;
    this.impressions = impressions;
    this.summaryText = summaryText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySubscriptionBundleView(item: LegacySubscriptionBundle): LegacySubscriptionBundleView {
  return new LegacySubscriptionBundleView(
    item.code,
    item.title,
    text.truncate(item.unit, 40),
    item.conversionRate.toFixed(2),
    item.locale,
    item.discount.toFixed(2),
    item.notes,
    String(item.impressions),
    item.summary,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySubscriptionBundleViews(items: LegacySubscriptionBundle[]): LegacySubscriptionBundleView[] {
  const views: LegacySubscriptionBundleView[] = [];
  for (const item of items) {
    views.push(toLegacySubscriptionBundleView(item));
  }
  return views;
}

export function sumLegacySubscriptionBundleView(view: LegacySubscriptionBundleView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedConversionRate + parsedDiscount + parsedImpressions;
}
