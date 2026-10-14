import * as text from "../../../../kit/text.js";
import { BadgeProfile } from "./badge-profile.js";

/** How screens and exports show a badge profile. */
export class BadgeProfileView {
  code: string;
  title: string;
  ceiling: string;
  durationMinutesText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceiling: string,
    durationMinutesText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.durationMinutesText = durationMinutesText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeProfileView(item: BadgeProfile): BadgeProfileView {
  return new BadgeProfileView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 40),
    item.ceiling.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.region, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeProfileViews(items: BadgeProfile[]): BadgeProfileView[] {
  const views: BadgeProfileView[] = [];
  for (const item of items) {
    views.push(toBadgeProfileView(item));
  }
  return views;
}

export function sumBadgeProfileView(view: BadgeProfileView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedCeiling + parsedDurationMinutes;
}
