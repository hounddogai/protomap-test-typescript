import * as text from "../../../../kit/text.js";
import { ApprovalReview } from "./approval-review.js";

/** How screens and exports show a approval review. */
export class ApprovalReviewView {
  code: string;
  title: string;
  currencyText: string;
  campaignRefText: string;
  utmSource: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currencyText: string,
    campaignRefText: string,
    utmSource: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currencyText = currencyText;
    this.campaignRefText = campaignRefText;
    this.utmSource = utmSource;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalReviewView(item: ApprovalReview): ApprovalReviewView {
  return new ApprovalReviewView(
    item.code,
    item.title,
    item.currency,
    text.truncate(item.campaignRef, 64),
    item.utmSource,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalReviewViews(items: ApprovalReview[]): ApprovalReviewView[] {
  const views: ApprovalReviewView[] = [];
  for (const item of items) {
    views.push(toApprovalReviewView(item));
  }
  return views;
}

export function sumApprovalReviewView(view: ApprovalReviewView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
