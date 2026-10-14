import { BadgeSummary } from "./badge-summary.js";

/** How screens and exports show a badge summary. */
export class BadgeSummaryView {
  code: string;
  name: string;
  updatedAtText: string;
  rateText: string;
  windowDays: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAtText: string,
    rateText: string,
    windowDays: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.rateText = rateText;
    this.windowDays = windowDays;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeSummaryView(item: BadgeSummary): BadgeSummaryView {
  return new BadgeSummaryView(
    item.code,
    item.name,
    String(item.updatedAt),
    item.rate.toFixed(2),
    String(item.windowDays),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeSummaryViews(items: BadgeSummary[]): BadgeSummaryView[] {
  const views: BadgeSummaryView[] = [];
  for (const item of items) {
    views.push(toBadgeSummaryView(item));
  }
  return views;
}

export function sumBadgeSummaryView(view: BadgeSummaryView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedUpdatedAt + parsedRate + parsedWindowDays;
}
