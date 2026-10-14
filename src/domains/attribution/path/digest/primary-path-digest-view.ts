import * as text from "../../../../kit/text.js";
import { PrimaryPathDigest } from "./primary-path-digest.js";

/** How screens and exports show a primary path digest. */
export class PrimaryPathDigestView {
  code: string;
  label: string;
  utmSource: string;
  timezoneText: string;
  durationMinutes: string;
  attempts: string;
  startsAtText: string;
  updatedAtText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    timezoneText: string,
    durationMinutes: string,
    attempts: string,
    startsAtText: string,
    updatedAtText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.timezoneText = timezoneText;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.startsAtText = startsAtText;
    this.updatedAtText = updatedAtText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPathDigestView(item: PrimaryPathDigest): PrimaryPathDigestView {
  return new PrimaryPathDigestView(
    item.code,
    item.label,
    text.truncate(item.utmSource, 64),
    item.timezone,
    String(item.durationMinutes),
    String(item.attempts),
    String(item.startsAt),
    String(item.updatedAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPathDigestViews(items: PrimaryPathDigest[]): PrimaryPathDigestView[] {
  const views: PrimaryPathDigestView[] = [];
  for (const item of items) {
    views.push(toPrimaryPathDigestView(item));
  }
  return views;
}

export function sumPrimaryPathDigestView(view: PrimaryPathDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedDurationMinutes + parsedAttempts + parsedStartsAt;
}
