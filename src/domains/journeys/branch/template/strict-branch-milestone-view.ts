import * as text from "../../../../kit/text.js";
import { StrictBranchMilestone } from "./strict-branch-milestone.js";

/** How screens and exports show a strict branch milestone. */
export class StrictBranchMilestoneView {
  code: string;
  name: string;
  segmentText: string;
  reviewerText: string;
  locale: string;
  sourceText: string;
  bidText: string;
  threshold: string;
  externalRefText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segmentText: string,
    reviewerText: string,
    locale: string,
    sourceText: string,
    bidText: string,
    threshold: string,
    externalRefText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segmentText = segmentText;
    this.reviewerText = reviewerText;
    this.locale = locale;
    this.sourceText = sourceText;
    this.bidText = bidText;
    this.threshold = threshold;
    this.externalRefText = externalRefText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBranchMilestoneView(item: StrictBranchMilestone): StrictBranchMilestoneView {
  return new StrictBranchMilestoneView(
    item.code,
    item.name,
    item.segment,
    text.truncate(item.reviewer, 120),
    item.locale,
    item.source,
    item.bid.toFixed(2),
    item.threshold.toFixed(2),
    text.truncate(item.externalRef, 120),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBranchMilestoneViews(items: StrictBranchMilestone[]): StrictBranchMilestoneView[] {
  const views: StrictBranchMilestoneView[] = [];
  for (const item of items) {
    views.push(toStrictBranchMilestoneView(item));
  }
  return views;
}

export function sumStrictBranchMilestoneView(view: StrictBranchMilestoneView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedBid + parsedThreshold + parsedMinimum;
}
