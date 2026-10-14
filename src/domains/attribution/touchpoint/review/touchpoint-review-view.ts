import { TouchpointReview } from "./touchpoint-review.js";

/** How screens and exports show a touchpoint review. */
export class TouchpointReviewView {
  code: string;
  titleText: string;
  ceiling: string;
  createdAt: string;
  startsAtText: string;
  campaignRef: string;
  bid: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    createdAt: string,
    startsAtText: string,
    campaignRef: string,
    bid: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.startsAtText = startsAtText;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointReviewView(item: TouchpointReview): TouchpointReviewView {
  return new TouchpointReviewView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    String(item.createdAt),
    String(item.startsAt),
    item.campaignRef,
    item.bid.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointReviewViews(items: TouchpointReview[]): TouchpointReviewView[] {
  const views: TouchpointReviewView[] = [];
  for (const item of items) {
    views.push(toTouchpointReviewView(item));
  }
  return views;
}

export function sumTouchpointReviewView(view: TouchpointReviewView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedCeiling + parsedCreatedAt + parsedStartsAt;
}
