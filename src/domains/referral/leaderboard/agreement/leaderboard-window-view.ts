import * as text from "../../../../kit/text.js";
import { LeaderboardWindow } from "./leaderboard-window.js";

/** How screens and exports show a leaderboard window. */
export class LeaderboardWindowView {
  code: string;
  nameText: string;
  retries: string;
  country: string;
  clicks: string;
  ceiling: string;
  threshold: string;
  source: string;
  utmSource: string;
  description: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    retries: string,
    country: string,
    clicks: string,
    ceiling: string,
    threshold: string,
    source: string,
    utmSource: string,
    description: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.retries = retries;
    this.country = country;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.threshold = threshold;
    this.source = source;
    this.utmSource = utmSource;
    this.description = description;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardWindowView(item: LeaderboardWindow): LeaderboardWindowView {
  return new LeaderboardWindowView(
    text.truncate(item.code, 120),
    item.name,
    String(item.retries),
    item.country,
    String(item.clicks),
    item.ceiling.toFixed(2),
    item.threshold.toFixed(2),
    text.truncate(item.source, 40),
    item.utmSource,
    item.description,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardWindowViews(items: LeaderboardWindow[]): LeaderboardWindowView[] {
  const views: LeaderboardWindowView[] = [];
  for (const item of items) {
    views.push(toLeaderboardWindowView(item));
  }
  return views;
}

export function sumLeaderboardWindowView(view: LeaderboardWindowView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRetries + parsedClicks + parsedCeiling;
}
