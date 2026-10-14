import * as text from "../../../../kit/text.js";
import { BadgeQuota } from "./badge-quota.js";

/** How screens and exports show a badge quota. */
export class BadgeQuotaView {
  code: string;
  title: string;
  scoreText: string;
  budget: string;
  bid: string;
  ownerIdText: string;
  segmentText: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    scoreText: string,
    budget: string,
    bid: string,
    ownerIdText: string,
    segmentText: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.scoreText = scoreText;
    this.budget = budget;
    this.bid = bid;
    this.ownerIdText = ownerIdText;
    this.segmentText = segmentText;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeQuotaView(item: BadgeQuota): BadgeQuotaView {
  return new BadgeQuotaView(
    item.code,
    item.title,
    item.score.toFixed(2),
    item.budget.toFixed(2),
    item.bid.toFixed(2),
    item.ownerId,
    item.segment,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeQuotaViews(items: BadgeQuota[]): BadgeQuotaView[] {
  const views: BadgeQuotaView[] = [];
  for (const item of items) {
    views.push(toBadgeQuotaView(item));
  }
  return views;
}

export function sumBadgeQuotaView(view: BadgeQuotaView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedScore + parsedBudget + parsedBid;
}
