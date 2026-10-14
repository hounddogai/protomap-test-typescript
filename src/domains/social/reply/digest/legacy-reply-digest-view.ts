import * as text from "../../../../kit/text.js";
import { LegacyReplyDigest } from "./legacy-reply-digest.js";

/** How screens and exports show a legacy reply digest. */
export class LegacyReplyDigestView {
  code: string;
  title: string;
  locale: string;
  bidText: string;
  category: string;
  timezone: string;
  conversionRateText: string;
  openRate: string;
  segmentText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    bidText: string,
    category: string,
    timezone: string,
    conversionRateText: string,
    openRate: string,
    segmentText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.bidText = bidText;
    this.category = category;
    this.timezone = timezone;
    this.conversionRateText = conversionRateText;
    this.openRate = openRate;
    this.segmentText = segmentText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyReplyDigestView(item: LegacyReplyDigest): LegacyReplyDigestView {
  return new LegacyReplyDigestView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    item.locale,
    item.bid.toFixed(2),
    item.category,
    item.timezone,
    item.conversionRate.toFixed(2),
    item.openRate.toFixed(2),
    item.segment,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyReplyDigestViews(items: LegacyReplyDigest[]): LegacyReplyDigestView[] {
  const views: LegacyReplyDigestView[] = [];
  for (const item of items) {
    views.push(toLegacyReplyDigestView(item));
  }
  return views;
}

export function sumLegacyReplyDigestView(view: LegacyReplyDigestView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBid + parsedConversionRate + parsedOpenRate;
}
