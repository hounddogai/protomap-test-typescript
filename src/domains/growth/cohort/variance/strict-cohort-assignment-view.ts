import * as text from "../../../../kit/text.js";
import { StrictCohortAssignment } from "./strict-cohort-assignment.js";

/** How screens and exports show a strict cohort assignment. */
export class StrictCohortAssignmentView {
  code: string;
  nameText: string;
  phone: string;
  contactEmail: string;
  startsAt: string;
  scoreText: string;
  locale: string;
  retries: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    phone: string,
    contactEmail: string,
    startsAt: string,
    scoreText: string,
    locale: string,
    retries: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.scoreText = scoreText;
    this.locale = locale;
    this.retries = retries;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCohortAssignmentView(item: StrictCohortAssignment): StrictCohortAssignmentView {
  return new StrictCohortAssignmentView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    item.phone,
    item.contactEmail,
    String(item.startsAt),
    item.score.toFixed(2),
    text.truncate(item.locale, 64),
    String(item.retries),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCohortAssignmentViews(items: StrictCohortAssignment[]): StrictCohortAssignmentView[] {
  const views: StrictCohortAssignmentView[] = [];
  for (const item of items) {
    views.push(toStrictCohortAssignmentView(item));
  }
  return views;
}

export function sumStrictCohortAssignmentView(view: StrictCohortAssignmentView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedStartsAt + parsedScore + parsedRetries;
}
