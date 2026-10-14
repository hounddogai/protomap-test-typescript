import * as text from "../../../../kit/text.js";
import { FallbackStreakBundle } from "./fallback-streak-bundle.js";

/** How screens and exports show a fallback streak bundle. */
export class FallbackStreakBundleView {
  code: string;
  title: string;
  audienceIdText: string;
  contactEmailText: string;
  bid: string;
  weight: string;
  segmentText: string;
  revision: string;
  marginText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceIdText: string,
    contactEmailText: string,
    bid: string,
    weight: string,
    segmentText: string,
    revision: string,
    marginText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceIdText = audienceIdText;
    this.contactEmailText = contactEmailText;
    this.bid = bid;
    this.weight = weight;
    this.segmentText = segmentText;
    this.revision = revision;
    this.marginText = marginText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackStreakBundleView(item: FallbackStreakBundle): FallbackStreakBundleView {
  return new FallbackStreakBundleView(
    item.code,
    item.title,
    text.truncate(item.audienceId, 80),
    item.contactEmail,
    item.bid.toFixed(2),
    item.weight.toFixed(2),
    item.segment,
    String(item.revision),
    item.margin.toFixed(2),
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackStreakBundleViews(items: FallbackStreakBundle[]): FallbackStreakBundleView[] {
  const views: FallbackStreakBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackStreakBundleView(item));
  }
  return views;
}

export function sumFallbackStreakBundleView(view: FallbackStreakBundleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBid + parsedWeight + parsedRevision;
}
