import * as text from "../../../../kit/text.js";
import { DefaultPreferenceMilestone } from "./default-preference-milestone.js";

/** How screens and exports show a default preference milestone. */
export class DefaultPreferenceMilestoneView {
  code: string;
  title: string;
  bid: string;
  rateText: string;
  reviewer: string;
  updatedAt: string;
  expiresAtText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    rateText: string,
    reviewer: string,
    updatedAt: string,
    expiresAtText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.rateText = rateText;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.expiresAtText = expiresAtText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPreferenceMilestoneView(item: DefaultPreferenceMilestone): DefaultPreferenceMilestoneView {
  return new DefaultPreferenceMilestoneView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.reviewer, 80),
    String(item.updatedAt),
    String(item.expiresAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPreferenceMilestoneViews(items: DefaultPreferenceMilestone[]): DefaultPreferenceMilestoneView[] {
  const views: DefaultPreferenceMilestoneView[] = [];
  for (const item of items) {
    views.push(toDefaultPreferenceMilestoneView(item));
  }
  return views;
}

export function sumDefaultPreferenceMilestoneView(view: DefaultPreferenceMilestoneView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBid + parsedRate + parsedUpdatedAt;
}
