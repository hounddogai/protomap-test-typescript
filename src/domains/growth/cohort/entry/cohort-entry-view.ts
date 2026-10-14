import * as text from "../../../../kit/text.js";
import { CohortEntry } from "./cohort-entry.js";

/** How screens and exports show a cohort entry. */
export class CohortEntryView {
  code: string;
  label: string;
  reviewer: string;
  currency: string;
  rate: string;
  createdAt: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    currency: string,
    rate: string,
    createdAt: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.currency = currency;
    this.rate = rate;
    this.createdAt = createdAt;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortEntryView(item: CohortEntry): CohortEntryView {
  return new CohortEntryView(
    text.truncate(item.code, 40),
    item.label,
    item.reviewer,
    text.truncate(item.currency, 40),
    item.rate.toFixed(2),
    String(item.createdAt),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortEntryViews(items: CohortEntry[]): CohortEntryView[] {
  const views: CohortEntryView[] = [];
  for (const item of items) {
    views.push(toCohortEntryView(item));
  }
  return views;
}

export function sumCohortEntryView(view: CohortEntryView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRate + parsedCreatedAt;
}
