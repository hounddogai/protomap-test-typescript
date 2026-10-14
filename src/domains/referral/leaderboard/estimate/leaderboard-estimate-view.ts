import * as text from "../../../../kit/text.js";
import { LeaderboardEstimate } from "./leaderboard-estimate.js";

/** How screens and exports show a leaderboard estimate. */
export class LeaderboardEstimateView {
  code: string;
  labelText: string;
  windowDays: string;
  timezone: string;
  cohort: string;
  segmentText: string;
  budget: string;
  utmSource: string;
  checksum: string;
  rateText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    windowDays: string,
    timezone: string,
    cohort: string,
    segmentText: string,
    budget: string,
    utmSource: string,
    checksum: string,
    rateText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.windowDays = windowDays;
    this.timezone = timezone;
    this.cohort = cohort;
    this.segmentText = segmentText;
    this.budget = budget;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.rateText = rateText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardEstimateView(item: LeaderboardEstimate): LeaderboardEstimateView {
  return new LeaderboardEstimateView(
    text.truncate(item.code, 64),
    item.label,
    String(item.windowDays),
    text.truncate(item.timezone, 120),
    text.truncate(item.cohort, 80),
    item.segment,
    item.budget.toFixed(2),
    text.truncate(item.utmSource, 120),
    item.checksum,
    item.rate.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardEstimateViews(items: LeaderboardEstimate[]): LeaderboardEstimateView[] {
  const views: LeaderboardEstimateView[] = [];
  for (const item of items) {
    views.push(toLeaderboardEstimateView(item));
  }
  return views;
}

export function sumLeaderboardEstimateView(view: LeaderboardEstimateView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedWindowDays + parsedBudget + parsedRate;
}
