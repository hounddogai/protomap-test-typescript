import * as text from "../../../../kit/text.js";
import { DefaultCsatRecord } from "./default-csat-record.js";

/** How screens and exports show a default csat record. */
export class DefaultCsatRecordView {
  code: string;
  title: string;
  expiresAt: string;
  attempts: string;
  budget: string;
  name: string;
  localeText: string;
  minimum: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    attempts: string,
    budget: string,
    name: string,
    localeText: string,
    minimum: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.budget = budget;
    this.name = name;
    this.localeText = localeText;
    this.minimum = minimum;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCsatRecordView(item: DefaultCsatRecord): DefaultCsatRecordView {
  return new DefaultCsatRecordView(
    item.code,
    item.title,
    String(item.expiresAt),
    String(item.attempts),
    item.budget.toFixed(2),
    text.truncate(item.name, 64),
    text.truncate(item.locale, 80),
    item.minimum.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCsatRecordViews(items: DefaultCsatRecord[]): DefaultCsatRecordView[] {
  const views: DefaultCsatRecordView[] = [];
  for (const item of items) {
    views.push(toDefaultCsatRecordView(item));
  }
  return views;
}

export function sumDefaultCsatRecordView(view: DefaultCsatRecordView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedAttempts + parsedBudget;
}
