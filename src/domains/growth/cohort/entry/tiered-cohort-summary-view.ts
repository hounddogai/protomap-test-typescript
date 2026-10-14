import * as text from "../../../../kit/text.js";
import { TieredCohortSummary } from "./tiered-cohort-summary.js";

/** How screens and exports show a tiered cohort summary. */
export class TieredCohortSummaryView {
  code: string;
  title: string;
  marginText: string;
  startsAt: string;
  utmSource: string;
  sequence: string;
  phone: string;
  graceDays: string;
  updatedAt: string;
  priority: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    marginText: string,
    startsAt: string,
    utmSource: string,
    sequence: string,
    phone: string,
    graceDays: string,
    updatedAt: string,
    priority: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.marginText = marginText;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.phone = phone;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortSummaryView(item: TieredCohortSummary): TieredCohortSummaryView {
  return new TieredCohortSummaryView(
    text.truncate(item.code, 40),
    item.title,
    item.margin.toFixed(2),
    String(item.startsAt),
    text.truncate(item.utmSource, 80),
    String(item.sequence),
    text.truncate(item.phone, 80),
    String(item.graceDays),
    String(item.updatedAt),
    String(item.priority),
    text.truncate(item.description, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortSummaryViews(items: TieredCohortSummary[]): TieredCohortSummaryView[] {
  const views: TieredCohortSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredCohortSummaryView(item));
  }
  return views;
}

export function sumTieredCohortSummaryView(view: TieredCohortSummaryView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedMargin + parsedStartsAt + parsedSequence;
}
