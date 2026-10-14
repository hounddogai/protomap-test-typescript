import * as text from "../../../../kit/text.js";
import { StrictDomainReview } from "./strict-domain-review.js";

/** How screens and exports show a strict domain review. */
export class StrictDomainReviewView {
  code: string;
  title: string;
  campaignRefText: string;
  name: string;
  endsAt: string;
  labelText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRefText: string,
    name: string,
    endsAt: string,
    labelText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.name = name;
    this.endsAt = endsAt;
    this.labelText = labelText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toStrictDomainReviewView(item: StrictDomainReview): StrictDomainReviewView {
  return new StrictDomainReviewView(
    text.truncate(item.code, 64),
    item.title,
    item.campaignRef,
    item.name,
    String(item.endsAt),
    text.truncate(item.label, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictDomainReviewViews(items: StrictDomainReview[]): StrictDomainReviewView[] {
  const views: StrictDomainReviewView[] = [];
  for (const item of items) {
    views.push(toStrictDomainReviewView(item));
  }
  return views;
}

export function sumStrictDomainReviewView(view: StrictDomainReviewView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedEndsAt + parsedScore;
}
