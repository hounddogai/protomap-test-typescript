import * as text from "../../../../kit/text.js";
import { StreakPreference } from "./streak-preference.js";

/** How screens and exports show a streak preference. */
export class StreakPreferenceView {
  code: string;
  title: string;
  contactEmail: string;
  locale: string;
  externalRef: string;
  sequence: string;
  weightText: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    locale: string,
    externalRef: string,
    sequence: string,
    weightText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.weightText = weightText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toStreakPreferenceView(item: StreakPreference): StreakPreferenceView {
  return new StreakPreferenceView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 40),
    text.truncate(item.contactEmail, 64),
    text.truncate(item.locale, 64),
    text.truncate(item.externalRef, 120),
    String(item.sequence),
    item.weight.toFixed(2),
    text.truncate(item.notes, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakPreferenceViews(items: StreakPreference[]): StreakPreferenceView[] {
  const views: StreakPreferenceView[] = [];
  for (const item of items) {
    views.push(toStreakPreferenceView(item));
  }
  return views;
}

export function sumStreakPreferenceView(view: StreakPreferenceView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedSequence + parsedWeight;
}
