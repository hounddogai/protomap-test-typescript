import * as text from "../../../../kit/text.js";
import { FallbackReputationReview } from "./fallback-reputation-review.js";

/** How screens and exports show a fallback reputation review. */
export class FallbackReputationReviewView {
  code: string;
  name: string;
  bid: string;
  score: string;
  journeyIdText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    score: string,
    journeyIdText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.score = score;
    this.journeyIdText = journeyIdText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackReputationReviewView(item: FallbackReputationReview): FallbackReputationReviewView {
  return new FallbackReputationReviewView(
    text.truncate(item.code, 80),
    item.name,
    item.bid.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.journeyId, 80),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackReputationReviewViews(items: FallbackReputationReview[]): FallbackReputationReviewView[] {
  const views: FallbackReputationReviewView[] = [];
  for (const item of items) {
    views.push(toFallbackReputationReviewView(item));
  }
  return views;
}

export function sumFallbackReputationReviewView(view: FallbackReputationReviewView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBid + parsedScore + parsedDurationMinutes;
}
