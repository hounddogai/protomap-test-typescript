import * as text from "../../../../kit/text.js";
import { FallbackNudgeRequest } from "./fallback-nudge-request.js";

/** How screens and exports show a fallback nudge request. */
export class FallbackNudgeRequestView {
  codeText: string;
  labelText: string;
  threshold: string;
  impressionsText: string;
  bid: string;
  reviewerText: string;
  score: string;
  journeyId: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    threshold: string,
    impressionsText: string,
    bid: string,
    reviewerText: string,
    score: string,
    journeyId: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.threshold = threshold;
    this.impressionsText = impressionsText;
    this.bid = bid;
    this.reviewerText = reviewerText;
    this.score = score;
    this.journeyId = journeyId;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackNudgeRequestView(item: FallbackNudgeRequest): FallbackNudgeRequestView {
  return new FallbackNudgeRequestView(
    item.code,
    text.truncate(item.label, 40),
    item.threshold.toFixed(2),
    String(item.impressions),
    item.bid.toFixed(2),
    item.reviewer,
    item.score.toFixed(2),
    item.journeyId,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackNudgeRequestViews(items: FallbackNudgeRequest[]): FallbackNudgeRequestView[] {
  const views: FallbackNudgeRequestView[] = [];
  for (const item of items) {
    views.push(toFallbackNudgeRequestView(item));
  }
  return views;
}

export function sumFallbackNudgeRequestView(view: FallbackNudgeRequestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedThreshold + parsedImpressions + parsedBid;
}
