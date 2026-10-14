import * as text from "../../../../kit/text.js";
import { SeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

/** How screens and exports show a seasonal approval milestone. */
export class SeasonalApprovalMilestoneView {
  code: string;
  title: string;
  ceiling: string;
  reviewer: string;
  windowDaysText: string;
  impressionsText: string;
  score: string;
  attempts: string;
  cost: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceiling: string,
    reviewer: string,
    windowDaysText: string,
    impressionsText: string,
    score: string,
    attempts: string,
    cost: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.windowDaysText = windowDaysText;
    this.impressionsText = impressionsText;
    this.score = score;
    this.attempts = attempts;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalApprovalMilestoneView(item: SeasonalApprovalMilestone): SeasonalApprovalMilestoneView {
  return new SeasonalApprovalMilestoneView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.ceiling.toFixed(2),
    item.reviewer,
    String(item.windowDays),
    String(item.impressions),
    item.score.toFixed(2),
    String(item.attempts),
    item.cost.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalApprovalMilestoneViews(items: SeasonalApprovalMilestone[]): SeasonalApprovalMilestoneView[] {
  const views: SeasonalApprovalMilestoneView[] = [];
  for (const item of items) {
    views.push(toSeasonalApprovalMilestoneView(item));
  }
  return views;
}

export function sumSeasonalApprovalMilestoneView(view: SeasonalApprovalMilestoneView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedCeiling + parsedWindowDays + parsedImpressions;
}
