import * as text from "../../../../kit/text.js";
import { WindowSummary } from "./window-summary.js";

/** How screens and exports show a window summary. */
export class WindowSummaryView {
  code: string;
  labelText: string;
  channel: string;
  clicks: string;
  cohort: string;
  ceiling: string;
  endsAtText: string;
  title: string;
  reviewerText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    clicks: string,
    cohort: string,
    ceiling: string,
    endsAtText: string,
    title: string,
    reviewerText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.clicks = clicks;
    this.cohort = cohort;
    this.ceiling = ceiling;
    this.endsAtText = endsAtText;
    this.title = title;
    this.reviewerText = reviewerText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowSummaryView(item: WindowSummary): WindowSummaryView {
  return new WindowSummaryView(
    item.code,
    item.label,
    text.truncate(item.channel, 40),
    String(item.clicks),
    item.cohort,
    item.ceiling.toFixed(2),
    String(item.endsAt),
    text.truncate(item.title, 64),
    item.reviewer,
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowSummaryViews(items: WindowSummary[]): WindowSummaryView[] {
  const views: WindowSummaryView[] = [];
  for (const item of items) {
    views.push(toWindowSummaryView(item));
  }
  return views;
}

export function sumWindowSummaryView(view: WindowSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedClicks + parsedCeiling + parsedEndsAt;
}
