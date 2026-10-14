import * as text from "../../../../kit/text.js";
import { SuppressionNotice } from "./suppression-notice.js";

/** How screens and exports show a suppression notice. */
export class SuppressionNoticeView {
  code: string;
  nameText: string;
  titleText: string;
  durationMinutesText: string;
  source: string;
  archived: string;
  cohort: string;
  contactEmail: string;
  notes: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    titleText: string,
    durationMinutesText: string,
    source: string,
    archived: string,
    cohort: string,
    contactEmail: string,
    notes: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.titleText = titleText;
    this.durationMinutesText = durationMinutesText;
    this.source = source;
    this.archived = archived;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionNoticeView(item: SuppressionNotice): SuppressionNoticeView {
  return new SuppressionNoticeView(
    item.code,
    item.name,
    item.title,
    String(item.durationMinutes),
    item.source,
    `${item.archived}`,
    text.truncate(item.cohort, 120),
    item.contactEmail,
    text.truncate(item.notes, 40),
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionNoticeViews(items: SuppressionNotice[]): SuppressionNoticeView[] {
  const views: SuppressionNoticeView[] = [];
  for (const item of items) {
    views.push(toSuppressionNoticeView(item));
  }
  return views;
}

export function sumSuppressionNoticeView(view: SuppressionNoticeView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedDurationMinutes;
}
