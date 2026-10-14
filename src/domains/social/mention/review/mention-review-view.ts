import * as text from "../../../../kit/text.js";
import { MentionReview } from "./mention-review.js";

/** How screens and exports show a mention review. */
export class MentionReviewView {
  code: string;
  label: string;
  category: string;
  openRate: string;
  floorValueText: string;
  locale: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    openRate: string,
    floorValueText: string,
    locale: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.openRate = openRate;
    this.floorValueText = floorValueText;
    this.locale = locale;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toMentionReviewView(item: MentionReview): MentionReviewView {
  return new MentionReviewView(
    item.code,
    item.label,
    text.truncate(item.category, 120),
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    item.locale,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionReviewViews(items: MentionReview[]): MentionReviewView[] {
  const views: MentionReviewView[] = [];
  for (const item of items) {
    views.push(toMentionReviewView(item));
  }
  return views;
}

export function sumMentionReviewView(view: MentionReviewView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedOpenRate + parsedFloorValue + parsedRetries;
}
