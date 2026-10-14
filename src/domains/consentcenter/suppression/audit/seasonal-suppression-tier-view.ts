import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

/** How screens and exports show a seasonal suppression tier. */
export class SeasonalSuppressionTierView {
  code: string;
  titleText: string;
  visible: string;
  windowDays: string;
  locale: string;
  contactEmail: string;
  currency: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    visible: string,
    windowDays: string,
    locale: string,
    contactEmail: string,
    currency: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.visible = visible;
    this.windowDays = windowDays;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSuppressionTierView(item: SeasonalSuppressionTier): SeasonalSuppressionTierView {
  return new SeasonalSuppressionTierView(
    item.code,
    item.title,
    `${item.visible}`,
    String(item.windowDays),
    item.locale,
    text.truncate(item.contactEmail, 120),
    item.currency,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSuppressionTierViews(items: SeasonalSuppressionTier[]): SeasonalSuppressionTierView[] {
  const views: SeasonalSuppressionTierView[] = [];
  for (const item of items) {
    views.push(toSeasonalSuppressionTierView(item));
  }
  return views;
}

export function sumSeasonalSuppressionTierView(view: SeasonalSuppressionTierView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedWindowDays + parsedImpressions;
}
