import * as text from "../../../../kit/text.js";
import { BadgeBaseline } from "./badge-baseline.js";

/** How screens and exports show a badge baseline. */
export class BadgeBaselineView {
  codeText: string;
  nameText: string;
  clicksText: string;
  reviewerText: string;
  rateText: string;
  startsAt: string;
  journeyId: string;
  limitText: string;
  quantity: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    clicksText: string,
    reviewerText: string,
    rateText: string,
    startsAt: string,
    journeyId: string,
    limitText: string,
    quantity: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.clicksText = clicksText;
    this.reviewerText = reviewerText;
    this.rateText = rateText;
    this.startsAt = startsAt;
    this.journeyId = journeyId;
    this.limitText = limitText;
    this.quantity = quantity;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeBaselineView(item: BadgeBaseline): BadgeBaselineView {
  return new BadgeBaselineView(
    item.code,
    item.name,
    String(item.clicks),
    text.truncate(item.reviewer, 64),
    item.rate.toFixed(2),
    String(item.startsAt),
    text.truncate(item.journeyId, 64),
    String(item.limit),
    String(item.quantity),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeBaselineViews(items: BadgeBaseline[]): BadgeBaselineView[] {
  const views: BadgeBaselineView[] = [];
  for (const item of items) {
    views.push(toBadgeBaselineView(item));
  }
  return views;
}

export function sumBadgeBaselineView(view: BadgeBaselineView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedClicks + parsedRate + parsedStartsAt;
}
