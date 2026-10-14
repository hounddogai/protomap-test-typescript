import { RegionalChallengeReview } from "./regional-challenge-review.js";

/** How screens and exports show a regional challenge review. */
export class RegionalChallengeReviewView {
  codeText: string;
  titleText: string;
  summary: string;
  notes: string;
  updatedAt: string;
  revision: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    summary: string,
    notes: string,
    updatedAt: string,
    revision: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.summary = summary;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalChallengeReviewView(item: RegionalChallengeReview): RegionalChallengeReviewView {
  return new RegionalChallengeReviewView(
    item.code,
    item.title,
    item.summary,
    item.notes,
    String(item.updatedAt),
    String(item.revision),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalChallengeReviewViews(items: RegionalChallengeReview[]): RegionalChallengeReviewView[] {
  const views: RegionalChallengeReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalChallengeReviewView(item));
  }
  return views;
}

export function sumRegionalChallengeReviewView(view: RegionalChallengeReviewView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedUpdatedAt + parsedRevision + parsedRatio;
}
