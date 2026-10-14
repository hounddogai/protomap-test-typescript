import * as text from "../../../../kit/text.js";
import { SuppressionPreference } from "./suppression-preference.js";

/** How screens and exports show a suppression preference. */
export class SuppressionPreferenceView {
  code: string;
  title: string;
  locale: string;
  summary: string;
  cohort: string;
  ratioText: string;
  campaignRef: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    summary: string,
    cohort: string,
    ratioText: string,
    campaignRef: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.summary = summary;
    this.cohort = cohort;
    this.ratioText = ratioText;
    this.campaignRef = campaignRef;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionPreferenceView(item: SuppressionPreference): SuppressionPreferenceView {
  return new SuppressionPreferenceView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.locale, 120),
    text.truncate(item.summary, 80),
    item.cohort,
    item.ratio.toFixed(2),
    item.campaignRef,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionPreferenceViews(items: SuppressionPreference[]): SuppressionPreferenceView[] {
  const views: SuppressionPreferenceView[] = [];
  for (const item of items) {
    views.push(toSuppressionPreferenceView(item));
  }
  return views;
}

export function sumSuppressionPreferenceView(view: SuppressionPreferenceView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedRatio + parsedAttempts;
}
