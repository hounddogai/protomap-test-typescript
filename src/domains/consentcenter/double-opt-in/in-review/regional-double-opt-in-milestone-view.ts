import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInMilestone } from "./regional-double-opt-in-milestone.js";

/** How screens and exports show a regional double opt in milestone. */
export class RegionalDoubleOptInMilestoneView {
  code: string;
  nameText: string;
  categoryText: string;
  graceDays: string;
  updatedAt: string;
  channelText: string;
  cohort: string;
  scoreText: string;
  attempts: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    categoryText: string,
    graceDays: string,
    updatedAt: string,
    channelText: string,
    cohort: string,
    scoreText: string,
    attempts: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.categoryText = categoryText;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.channelText = channelText;
    this.cohort = cohort;
    this.scoreText = scoreText;
    this.attempts = attempts;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalDoubleOptInMilestoneView(item: RegionalDoubleOptInMilestone): RegionalDoubleOptInMilestoneView {
  return new RegionalDoubleOptInMilestoneView(
    item.code,
    item.name,
    text.truncate(item.category, 80),
    String(item.graceDays),
    String(item.updatedAt),
    text.truncate(item.channel, 40),
    item.cohort,
    item.score.toFixed(2),
    String(item.attempts),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalDoubleOptInMilestoneViews(items: RegionalDoubleOptInMilestone[]): RegionalDoubleOptInMilestoneView[] {
  const views: RegionalDoubleOptInMilestoneView[] = [];
  for (const item of items) {
    views.push(toRegionalDoubleOptInMilestoneView(item));
  }
  return views;
}

export function sumRegionalDoubleOptInMilestoneView(view: RegionalDoubleOptInMilestoneView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedGraceDays + parsedUpdatedAt + parsedScore;
}
