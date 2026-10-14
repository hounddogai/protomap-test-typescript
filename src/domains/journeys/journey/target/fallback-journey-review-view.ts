import * as text from "../../../../kit/text.js";
import { FallbackJourneyReview } from "./fallback-journey-review.js";

/** How screens and exports show a fallback journey review. */
export class FallbackJourneyReviewView {
  code: string;
  name: string;
  durationMinutes: string;
  visible: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    visible: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackJourneyReviewView(item: FallbackJourneyReview): FallbackJourneyReviewView {
  return new FallbackJourneyReviewView(
    item.code,
    text.truncate(item.name, 120),
    String(item.durationMinutes),
    `${item.visible}`,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackJourneyReviewViews(items: FallbackJourneyReview[]): FallbackJourneyReviewView[] {
  const views: FallbackJourneyReviewView[] = [];
  for (const item of items) {
    views.push(toFallbackJourneyReviewView(item));
  }
  return views;
}

export function sumFallbackJourneyReviewView(view: FallbackJourneyReviewView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
