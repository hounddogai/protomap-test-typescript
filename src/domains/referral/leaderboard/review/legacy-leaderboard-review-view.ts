import * as text from "../../../../kit/text.js";
import { LegacyLeaderboardReview } from "./legacy-leaderboard-review.js";

/** How screens and exports show a legacy leaderboard review. */
export class LegacyLeaderboardReviewView {
  codeText: string;
  title: string;
  cohort: string;
  discount: string;
  durationMinutes: string;
  variant: string;
  retries: string;
  windowDaysText: string;
  budget: string;
  sendAt: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cohort: string,
    discount: string,
    durationMinutes: string,
    variant: string,
    retries: string,
    windowDaysText: string,
    budget: string,
    sendAt: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cohort = cohort;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.retries = retries;
    this.windowDaysText = windowDaysText;
    this.budget = budget;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyLeaderboardReviewView(item: LegacyLeaderboardReview): LegacyLeaderboardReviewView {
  return new LegacyLeaderboardReviewView(
    item.code,
    text.truncate(item.title, 64),
    item.cohort,
    item.discount.toFixed(2),
    String(item.durationMinutes),
    item.variant,
    String(item.retries),
    String(item.windowDays),
    item.budget.toFixed(2),
    String(item.sendAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyLeaderboardReviewViews(items: LegacyLeaderboardReview[]): LegacyLeaderboardReviewView[] {
  const views: LegacyLeaderboardReviewView[] = [];
  for (const item of items) {
    views.push(toLegacyLeaderboardReviewView(item));
  }
  return views;
}

export function sumLegacyLeaderboardReviewView(view: LegacyLeaderboardReviewView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedDiscount + parsedDurationMinutes + parsedRetries;
}
