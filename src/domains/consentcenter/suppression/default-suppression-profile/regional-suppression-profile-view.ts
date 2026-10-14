import * as text from "../../../../kit/text.js";
import { RegionalSuppressionProfile } from "./regional-suppression-profile.js";

/** How screens and exports show a regional suppression profile. */
export class RegionalSuppressionProfileView {
  code: string;
  labelText: string;
  scoreText: string;
  active: string;
  bid: string;
  region: string;
  durationMinutes: string;
  endsAt: string;
  batchSizeText: string;
  rate: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    scoreText: string,
    active: string,
    bid: string,
    region: string,
    durationMinutes: string,
    endsAt: string,
    batchSizeText: string,
    rate: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.scoreText = scoreText;
    this.active = active;
    this.bid = bid;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.batchSizeText = batchSizeText;
    this.rate = rate;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSuppressionProfileView(item: RegionalSuppressionProfile): RegionalSuppressionProfileView {
  return new RegionalSuppressionProfileView(
    text.truncate(item.code, 120),
    item.label,
    item.score.toFixed(2),
    `${item.active}`,
    item.bid.toFixed(2),
    text.truncate(item.region, 120),
    String(item.durationMinutes),
    String(item.endsAt),
    String(item.batchSize),
    item.rate.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSuppressionProfileViews(items: RegionalSuppressionProfile[]): RegionalSuppressionProfileView[] {
  const views: RegionalSuppressionProfileView[] = [];
  for (const item of items) {
    views.push(toRegionalSuppressionProfileView(item));
  }
  return views;
}

export function sumRegionalSuppressionProfileView(view: RegionalSuppressionProfileView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedScore + parsedBid + parsedDurationMinutes;
}
