import { ChallengeSchedule } from "./challenge-schedule.js";

/** How screens and exports show a challenge schedule. */
export class ChallengeScheduleView {
  codeText: string;
  labelText: string;
  title: string;
  maximum: string;
  retries: string;
  minimum: string;
  impressionsText: string;
  floorValueText: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    title: string,
    maximum: string,
    retries: string,
    minimum: string,
    impressionsText: string,
    floorValueText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.title = title;
    this.maximum = maximum;
    this.retries = retries;
    this.minimum = minimum;
    this.impressionsText = impressionsText;
    this.floorValueText = floorValueText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeScheduleView(item: ChallengeSchedule): ChallengeScheduleView {
  return new ChallengeScheduleView(
    item.code,
    item.label,
    item.title,
    item.maximum.toFixed(2),
    String(item.retries),
    item.minimum.toFixed(2),
    String(item.impressions),
    item.floorValue.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeScheduleViews(items: ChallengeSchedule[]): ChallengeScheduleView[] {
  const views: ChallengeScheduleView[] = [];
  for (const item of items) {
    views.push(toChallengeScheduleView(item));
  }
  return views;
}

export function sumChallengeScheduleView(view: ChallengeScheduleView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMaximum + parsedRetries + parsedMinimum;
}
