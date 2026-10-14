import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

/** How screens and exports show a seasonal suppression segment. */
export class SeasonalSuppressionSegmentView {
  codeText: string;
  title: string;
  ownerIdText: string;
  margin: string;
  audienceId: string;
  conversionRate: string;
  expiresAt: string;
  currency: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ownerIdText: string,
    margin: string,
    audienceId: string,
    conversionRate: string,
    expiresAt: string,
    currency: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ownerIdText = ownerIdText;
    this.margin = margin;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSuppressionSegmentView(item: SeasonalSuppressionSegment): SeasonalSuppressionSegmentView {
  return new SeasonalSuppressionSegmentView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 40),
    item.ownerId,
    item.margin.toFixed(2),
    item.audienceId,
    item.conversionRate.toFixed(2),
    String(item.expiresAt),
    text.truncate(item.currency, 80),
    text.truncate(item.contactEmail, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSuppressionSegmentViews(items: SeasonalSuppressionSegment[]): SeasonalSuppressionSegmentView[] {
  const views: SeasonalSuppressionSegmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalSuppressionSegmentView(item));
  }
  return views;
}

export function sumSeasonalSuppressionSegmentView(view: SeasonalSuppressionSegmentView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedMargin + parsedConversionRate + parsedExpiresAt;
}
