import * as text from "../../../../kit/text.js";
import { TieredSuppressionSegment } from "./tiered-suppression-segment.js";

/** How screens and exports show a tiered suppression segment. */
export class TieredSuppressionSegmentView {
  code: string;
  nameText: string;
  approved: string;
  conversionRateText: string;
  externalRef: string;
  pinned: string;
  expiresAtText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    approved: string,
    conversionRateText: string,
    externalRef: string,
    pinned: string,
    expiresAtText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.approved = approved;
    this.conversionRateText = conversionRateText;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.expiresAtText = expiresAtText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSuppressionSegmentView(item: TieredSuppressionSegment): TieredSuppressionSegmentView {
  return new TieredSuppressionSegmentView(
    item.code,
    text.truncate(item.name, 64),
    `${item.approved}`,
    item.conversionRate.toFixed(2),
    item.externalRef,
    `${item.pinned}`,
    String(item.expiresAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSuppressionSegmentViews(items: TieredSuppressionSegment[]): TieredSuppressionSegmentView[] {
  const views: TieredSuppressionSegmentView[] = [];
  for (const item of items) {
    views.push(toTieredSuppressionSegmentView(item));
  }
  return views;
}

export function sumTieredSuppressionSegmentView(view: TieredSuppressionSegmentView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedConversionRate + parsedExpiresAt;
}
