import * as text from "../../../../kit/text.js";
import { BadgeReview } from "./badge-review.js";

/** How screens and exports show a badge review. */
export class BadgeReviewView {
  code: string;
  nameText: string;
  frequencyCap: string;
  threshold: string;
  sequence: string;
  journeyId: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    frequencyCap: string,
    threshold: string,
    sequence: string,
    journeyId: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeReviewView(item: BadgeReview): BadgeReviewView {
  return new BadgeReviewView(
    text.truncate(item.code, 120),
    item.name,
    String(item.frequencyCap),
    item.threshold.toFixed(2),
    String(item.sequence),
    item.journeyId,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeReviewViews(items: BadgeReview[]): BadgeReviewView[] {
  const views: BadgeReviewView[] = [];
  for (const item of items) {
    views.push(toBadgeReviewView(item));
  }
  return views;
}

export function sumBadgeReviewView(view: BadgeReviewView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedFrequencyCap + parsedThreshold + parsedSequence;
}
