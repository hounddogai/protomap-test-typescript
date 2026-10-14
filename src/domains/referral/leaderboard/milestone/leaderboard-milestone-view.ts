import * as text from "../../../../kit/text.js";
import { LeaderboardMilestone } from "./leaderboard-milestone.js";

/** How screens and exports show a leaderboard milestone. */
export class LeaderboardMilestoneView {
  code: string;
  label: string;
  budget: string;
  conversionRate: string;
  openRateText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    conversionRate: string,
    openRateText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.openRateText = openRateText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardMilestoneView(item: LeaderboardMilestone): LeaderboardMilestoneView {
  return new LeaderboardMilestoneView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    item.openRate.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardMilestoneViews(items: LeaderboardMilestone[]): LeaderboardMilestoneView[] {
  const views: LeaderboardMilestoneView[] = [];
  for (const item of items) {
    views.push(toLeaderboardMilestoneView(item));
  }
  return views;
}

export function sumLeaderboardMilestoneView(view: LeaderboardMilestoneView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedBudget + parsedConversionRate + parsedOpenRate;
}
