import * as text from "../../../../kit/text.js";
import { ScheduledStreakSummary } from "./scheduled-streak-summary.js";

/** How screens and exports show a scheduled streak summary. */
export class ScheduledStreakSummaryView {
  code: string;
  nameText: string;
  titleText: string;
  limit: string;
  archived: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    titleText: string,
    limit: string,
    archived: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.titleText = titleText;
    this.limit = limit;
    this.archived = archived;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledStreakSummaryView(item: ScheduledStreakSummary): ScheduledStreakSummaryView {
  return new ScheduledStreakSummaryView(
    item.code,
    item.name,
    text.truncate(item.title, 120),
    String(item.limit),
    `${item.archived}`,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledStreakSummaryViews(items: ScheduledStreakSummary[]): ScheduledStreakSummaryView[] {
  const views: ScheduledStreakSummaryView[] = [];
  for (const item of items) {
    views.push(toScheduledStreakSummaryView(item));
  }
  return views;
}

export function sumScheduledStreakSummaryView(view: ScheduledStreakSummaryView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedLimit;
}
