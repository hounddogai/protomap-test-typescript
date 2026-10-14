import * as text from "../../../../kit/text.js";
import { StrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

/** How screens and exports show a strict paywall snapshot. */
export class StrictPaywallSnapshotView {
  code: string;
  title: string;
  bid: string;
  impressions: string;
  notes: string;
  audienceId: string;
  unit: string;
  locale: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    impressions: string,
    notes: string,
    audienceId: string,
    unit: string,
    locale: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.impressions = impressions;
    this.notes = notes;
    this.audienceId = audienceId;
    this.unit = unit;
    this.locale = locale;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPaywallSnapshotView(item: StrictPaywallSnapshot): StrictPaywallSnapshotView {
  return new StrictPaywallSnapshotView(
    text.truncate(item.code, 40),
    item.title,
    item.bid.toFixed(2),
    String(item.impressions),
    item.notes,
    text.truncate(item.audienceId, 80),
    item.unit,
    item.locale,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPaywallSnapshotViews(items: StrictPaywallSnapshot[]): StrictPaywallSnapshotView[] {
  const views: StrictPaywallSnapshotView[] = [];
  for (const item of items) {
    views.push(toStrictPaywallSnapshotView(item));
  }
  return views;
}

export function sumStrictPaywallSnapshotView(view: StrictPaywallSnapshotView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedBid + parsedImpressions;
}
