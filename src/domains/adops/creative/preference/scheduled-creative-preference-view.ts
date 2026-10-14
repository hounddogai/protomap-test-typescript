import * as text from "../../../../kit/text.js";
import { ScheduledCreativePreference } from "./scheduled-creative-preference.js";

/** How screens and exports show a scheduled creative preference. */
export class ScheduledCreativePreferenceView {
  code: string;
  label: string;
  approved: string;
  unit: string;
  attempts: string;
  campaignRefText: string;
  ratioText: string;
  country: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    unit: string,
    attempts: string,
    campaignRefText: string,
    ratioText: string,
    country: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.unit = unit;
    this.attempts = attempts;
    this.campaignRefText = campaignRefText;
    this.ratioText = ratioText;
    this.country = country;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCreativePreferenceView(item: ScheduledCreativePreference): ScheduledCreativePreferenceView {
  return new ScheduledCreativePreferenceView(
    item.code,
    text.truncate(item.label, 64),
    `${item.approved}`,
    item.unit,
    String(item.attempts),
    text.truncate(item.campaignRef, 40),
    item.ratio.toFixed(2),
    text.truncate(item.country, 40),
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCreativePreferenceViews(items: ScheduledCreativePreference[]): ScheduledCreativePreferenceView[] {
  const views: ScheduledCreativePreferenceView[] = [];
  for (const item of items) {
    views.push(toScheduledCreativePreferenceView(item));
  }
  return views;
}

export function sumScheduledCreativePreferenceView(view: ScheduledCreativePreferenceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedAttempts + parsedRatio;
}
