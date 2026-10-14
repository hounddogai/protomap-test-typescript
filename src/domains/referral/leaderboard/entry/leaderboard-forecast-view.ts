import * as text from "../../../../kit/text.js";
import { LeaderboardForecast } from "./leaderboard-forecast.js";

/** How screens and exports show a leaderboard forecast. */
export class LeaderboardForecastView {
  code: string;
  labelText: string;
  budget: string;
  locale: string;
  version: string;
  channel: string;
  reviewerText: string;
  clicks: string;
  bidText: string;
  archived: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budget: string,
    locale: string,
    version: string,
    channel: string,
    reviewerText: string,
    clicks: string,
    bidText: string,
    archived: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budget = budget;
    this.locale = locale;
    this.version = version;
    this.channel = channel;
    this.reviewerText = reviewerText;
    this.clicks = clicks;
    this.bidText = bidText;
    this.archived = archived;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardForecastView(item: LeaderboardForecast): LeaderboardForecastView {
  return new LeaderboardForecastView(
    text.truncate(item.code, 40),
    item.label,
    item.budget.toFixed(2),
    item.locale,
    String(item.version),
    item.channel,
    item.reviewer,
    String(item.clicks),
    item.bid.toFixed(2),
    `${item.archived}`,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardForecastViews(items: LeaderboardForecast[]): LeaderboardForecastView[] {
  const views: LeaderboardForecastView[] = [];
  for (const item of items) {
    views.push(toLeaderboardForecastView(item));
  }
  return views;
}

export function sumLeaderboardForecastView(view: LeaderboardForecastView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBudget + parsedVersion + parsedClicks;
}
