import * as text from "../../../../kit/text.js";
import { BidRuleSnapshot } from "./bid-rule-snapshot.js";

/** How screens and exports show a bid rule snapshot. */
export class BidRuleSnapshotView {
  code: string;
  labelText: string;
  locale: string;
  bid: string;
  durationMinutesText: string;
  country: string;
  audienceIdText: string;
  maximum: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    bid: string,
    durationMinutesText: string,
    country: string,
    audienceIdText: string,
    maximum: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.bid = bid;
    this.durationMinutesText = durationMinutesText;
    this.country = country;
    this.audienceIdText = audienceIdText;
    this.maximum = maximum;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleSnapshotView(item: BidRuleSnapshot): BidRuleSnapshotView {
  return new BidRuleSnapshotView(
    item.code,
    item.label,
    text.truncate(item.locale, 120),
    item.bid.toFixed(2),
    String(item.durationMinutes),
    item.country,
    text.truncate(item.audienceId, 80),
    item.maximum.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleSnapshotViews(items: BidRuleSnapshot[]): BidRuleSnapshotView[] {
  const views: BidRuleSnapshotView[] = [];
  for (const item of items) {
    views.push(toBidRuleSnapshotView(item));
  }
  return views;
}

export function sumBidRuleSnapshotView(view: BidRuleSnapshotView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedMaximum;
}
