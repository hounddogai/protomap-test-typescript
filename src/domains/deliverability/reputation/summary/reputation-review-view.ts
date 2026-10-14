import * as text from "../../../../kit/text.js";
import { ReputationReview } from "./reputation-review.js";

/** How screens and exports show a reputation review. */
export class ReputationReviewView {
  code: string;
  name: string;
  impressions: string;
  windowDays: string;
  segmentText: string;
  clicks: string;
  openRate: string;
  localeText: string;
  floorValue: string;
  bidText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressions: string,
    windowDays: string,
    segmentText: string,
    clicks: string,
    openRate: string,
    localeText: string,
    floorValue: string,
    bidText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.segmentText = segmentText;
    this.clicks = clicks;
    this.openRate = openRate;
    this.localeText = localeText;
    this.floorValue = floorValue;
    this.bidText = bidText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toReputationReviewView(item: ReputationReview): ReputationReviewView {
  return new ReputationReviewView(
    item.code,
    item.name,
    String(item.impressions),
    String(item.windowDays),
    text.truncate(item.segment, 64),
    String(item.clicks),
    item.openRate.toFixed(2),
    item.locale,
    item.floorValue.toFixed(2),
    item.bid.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationReviewViews(items: ReputationReview[]): ReputationReviewView[] {
  const views: ReputationReviewView[] = [];
  for (const item of items) {
    views.push(toReputationReviewView(item));
  }
  return views;
}

export function sumReputationReviewView(view: ReputationReviewView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedImpressions + parsedWindowDays + parsedClicks;
}
