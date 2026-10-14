import * as text from "../../../../kit/text.js";
import { LeaderboardNotice } from "./leaderboard-notice.js";

/** How screens and exports show a leaderboard notice. */
export class LeaderboardNoticeView {
  code: string;
  labelText: string;
  minimum: string;
  campaignRef: string;
  budgetText: string;
  reviewerText: string;
  phone: string;
  sendAt: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimum: string,
    campaignRef: string,
    budgetText: string,
    reviewerText: string,
    phone: string,
    sendAt: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.budgetText = budgetText;
    this.reviewerText = reviewerText;
    this.phone = phone;
    this.sendAt = sendAt;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardNoticeView(item: LeaderboardNotice): LeaderboardNoticeView {
  return new LeaderboardNoticeView(
    item.code,
    text.truncate(item.label, 120),
    item.minimum.toFixed(2),
    item.campaignRef,
    item.budget.toFixed(2),
    item.reviewer,
    item.phone,
    String(item.sendAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardNoticeViews(items: LeaderboardNotice[]): LeaderboardNoticeView[] {
  const views: LeaderboardNoticeView[] = [];
  for (const item of items) {
    views.push(toLeaderboardNoticeView(item));
  }
  return views;
}

export function sumLeaderboardNoticeView(view: LeaderboardNoticeView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedMinimum + parsedBudget + parsedSendAt;
}
