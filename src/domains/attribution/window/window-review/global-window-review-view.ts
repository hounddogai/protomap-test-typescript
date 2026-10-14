import { GlobalWindowReview } from "./global-window-review.js";

/** How screens and exports show a global window review. */
export class GlobalWindowReviewView {
  code: string;
  nameText: string;
  variant: string;
  approved: string;
  category: string;
  unitText: string;
  limitText: string;
  bidText: string;
  channel: string;
  labelText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    variant: string,
    approved: string,
    category: string,
    unitText: string,
    limitText: string,
    bidText: string,
    channel: string,
    labelText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.variant = variant;
    this.approved = approved;
    this.category = category;
    this.unitText = unitText;
    this.limitText = limitText;
    this.bidText = bidText;
    this.channel = channel;
    this.labelText = labelText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalWindowReviewView(item: GlobalWindowReview): GlobalWindowReviewView {
  return new GlobalWindowReviewView(
    item.code,
    item.name,
    item.variant,
    `${item.approved}`,
    item.category,
    item.unit,
    String(item.limit),
    item.bid.toFixed(2),
    item.channel,
    item.label,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalWindowReviewViews(items: GlobalWindowReview[]): GlobalWindowReviewView[] {
  const views: GlobalWindowReviewView[] = [];
  for (const item of items) {
    views.push(toGlobalWindowReviewView(item));
  }
  return views;
}

export function sumGlobalWindowReviewView(view: GlobalWindowReviewView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedLimit + parsedBid + parsedThreshold;
}
