import * as text from "../../../../kit/text.js";
import { LeaderboardMetric } from "./leaderboard-metric.js";

/** How screens and exports show a leaderboard metric. */
export class LeaderboardMetricView {
  code: string;
  title: string;
  version: string;
  thresholdText: string;
  budget: string;
  quantity: string;
  phoneText: string;
  category: string;
  checksum: string;
  source: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    thresholdText: string,
    budget: string,
    quantity: string,
    phoneText: string,
    category: string,
    checksum: string,
    source: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.thresholdText = thresholdText;
    this.budget = budget;
    this.quantity = quantity;
    this.phoneText = phoneText;
    this.category = category;
    this.checksum = checksum;
    this.source = source;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardMetricView(item: LeaderboardMetric): LeaderboardMetricView {
  return new LeaderboardMetricView(
    text.truncate(item.code, 40),
    item.title,
    String(item.version),
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    String(item.quantity),
    item.phone,
    text.truncate(item.category, 80),
    item.checksum,
    item.source,
    text.truncate(item.currency, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardMetricViews(items: LeaderboardMetric[]): LeaderboardMetricView[] {
  const views: LeaderboardMetricView[] = [];
  for (const item of items) {
    views.push(toLeaderboardMetricView(item));
  }
  return views;
}

export function sumLeaderboardMetricView(view: LeaderboardMetricView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedThreshold + parsedBudget;
}
