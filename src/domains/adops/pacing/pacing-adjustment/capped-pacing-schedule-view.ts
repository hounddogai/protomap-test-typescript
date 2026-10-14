import { CappedPacingSchedule } from "./capped-pacing-schedule.js";

/** How screens and exports show a capped pacing schedule. */
export class CappedPacingScheduleView {
  codeText: string;
  label: string;
  maximum: string;
  clicks: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    clicks: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.clicks = clicks;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPacingScheduleView(item: CappedPacingSchedule): CappedPacingScheduleView {
  return new CappedPacingScheduleView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    String(item.clicks),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPacingScheduleViews(items: CappedPacingSchedule[]): CappedPacingScheduleView[] {
  const views: CappedPacingScheduleView[] = [];
  for (const item of items) {
    views.push(toCappedPacingScheduleView(item));
  }
  return views;
}

export function sumCappedPacingScheduleView(view: CappedPacingScheduleView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedMaximum + parsedClicks + parsedScore;
}
