import * as text from "../../../../kit/text.js";
import { ScheduledPathForecast } from "./scheduled-path-forecast.js";

/** How screens and exports show a scheduled path forecast. */
export class ScheduledPathForecastView {
  code: string;
  title: string;
  pinnedText: string;
  segmentText: string;
  endsAtText: string;
  source: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    pinnedText: string,
    segmentText: string,
    endsAtText: string,
    source: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.pinnedText = pinnedText;
    this.segmentText = segmentText;
    this.endsAtText = endsAtText;
    this.source = source;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPathForecastView(item: ScheduledPathForecast): ScheduledPathForecastView {
  return new ScheduledPathForecastView(
    item.code,
    item.title,
    `${item.pinned}`,
    item.segment,
    String(item.endsAt),
    text.truncate(item.source, 64),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPathForecastViews(items: ScheduledPathForecast[]): ScheduledPathForecastView[] {
  const views: ScheduledPathForecastView[] = [];
  for (const item of items) {
    views.push(toScheduledPathForecastView(item));
  }
  return views;
}

export function sumScheduledPathForecastView(view: ScheduledPathForecastView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedEndsAt;
}
