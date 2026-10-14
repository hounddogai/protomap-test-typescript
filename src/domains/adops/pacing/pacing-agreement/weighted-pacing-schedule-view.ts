import * as text from "../../../../kit/text.js";
import { WeightedPacingSchedule } from "./weighted-pacing-schedule.js";

/** How screens and exports show a weighted pacing schedule. */
export class WeightedPacingScheduleView {
  code: string;
  name: string;
  margin: string;
  scoreText: string;
  externalRef: string;
  currency: string;
  limit: string;
  attempts: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    scoreText: string,
    externalRef: string,
    currency: string,
    limit: string,
    attempts: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.scoreText = scoreText;
    this.externalRef = externalRef;
    this.currency = currency;
    this.limit = limit;
    this.attempts = attempts;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPacingScheduleView(item: WeightedPacingSchedule): WeightedPacingScheduleView {
  return new WeightedPacingScheduleView(
    text.truncate(item.code, 80),
    item.name,
    item.margin.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.externalRef, 120),
    item.currency,
    String(item.limit),
    String(item.attempts),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPacingScheduleViews(items: WeightedPacingSchedule[]): WeightedPacingScheduleView[] {
  const views: WeightedPacingScheduleView[] = [];
  for (const item of items) {
    views.push(toWeightedPacingScheduleView(item));
  }
  return views;
}

export function sumWeightedPacingScheduleView(view: WeightedPacingScheduleView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMargin + parsedScore + parsedLimit;
}
