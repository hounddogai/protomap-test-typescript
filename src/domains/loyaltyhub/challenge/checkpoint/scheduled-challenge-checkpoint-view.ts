import * as text from "../../../../kit/text.js";
import { ScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

/** How screens and exports show a scheduled challenge checkpoint. */
export class ScheduledChallengeCheckpointView {
  code: string;
  name: string;
  countryText: string;
  timezoneText: string;
  minimum: string;
  active: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    countryText: string,
    timezoneText: string,
    minimum: string,
    active: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.countryText = countryText;
    this.timezoneText = timezoneText;
    this.minimum = minimum;
    this.active = active;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledChallengeCheckpointView(item: ScheduledChallengeCheckpoint): ScheduledChallengeCheckpointView {
  return new ScheduledChallengeCheckpointView(
    text.truncate(item.code, 120),
    item.name,
    item.country,
    item.timezone,
    item.minimum.toFixed(2),
    `${item.active}`,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledChallengeCheckpointViews(items: ScheduledChallengeCheckpoint[]): ScheduledChallengeCheckpointView[] {
  const views: ScheduledChallengeCheckpointView[] = [];
  for (const item of items) {
    views.push(toScheduledChallengeCheckpointView(item));
  }
  return views;
}

export function sumScheduledChallengeCheckpointView(view: ScheduledChallengeCheckpointView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedMinimum + parsedCreatedAt;
}
