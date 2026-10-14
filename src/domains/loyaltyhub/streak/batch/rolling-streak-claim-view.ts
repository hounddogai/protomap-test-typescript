import * as text from "../../../../kit/text.js";
import { RollingStreakClaim } from "./rolling-streak-claim.js";

/** How screens and exports show a rolling streak claim. */
export class RollingStreakClaimView {
  code: string;
  labelText: string;
  version: string;
  windowDaysText: string;
  locale: string;
  ceiling: string;
  campaignRef: string;
  category: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    windowDaysText: string,
    locale: string,
    ceiling: string,
    campaignRef: string,
    category: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.windowDaysText = windowDaysText;
    this.locale = locale;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.category = category;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStreakClaimView(item: RollingStreakClaim): RollingStreakClaimView {
  return new RollingStreakClaimView(
    item.code,
    item.label,
    String(item.version),
    String(item.windowDays),
    text.truncate(item.locale, 80),
    item.ceiling.toFixed(2),
    item.campaignRef,
    text.truncate(item.category, 120),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStreakClaimViews(items: RollingStreakClaim[]): RollingStreakClaimView[] {
  const views: RollingStreakClaimView[] = [];
  for (const item of items) {
    views.push(toRollingStreakClaimView(item));
  }
  return views;
}

export function sumRollingStreakClaimView(view: RollingStreakClaimView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedVersion + parsedWindowDays + parsedCeiling;
}
