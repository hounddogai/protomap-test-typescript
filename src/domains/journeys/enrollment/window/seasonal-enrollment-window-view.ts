import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

/** How screens and exports show a seasonal enrollment window. */
export class SeasonalEnrollmentWindowView {
  codeText: string;
  title: string;
  limit: string;
  sourceText: string;
  timezone: string;
  sendAt: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    limit: string,
    sourceText: string,
    timezone: string,
    sendAt: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.limit = limit;
    this.sourceText = sourceText;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalEnrollmentWindowView(item: SeasonalEnrollmentWindow): SeasonalEnrollmentWindowView {
  return new SeasonalEnrollmentWindowView(
    text.truncate(item.code, 120),
    item.title,
    String(item.limit),
    text.truncate(item.source, 120),
    text.truncate(item.timezone, 120),
    String(item.sendAt),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalEnrollmentWindowViews(items: SeasonalEnrollmentWindow[]): SeasonalEnrollmentWindowView[] {
  const views: SeasonalEnrollmentWindowView[] = [];
  for (const item of items) {
    views.push(toSeasonalEnrollmentWindowView(item));
  }
  return views;
}

export function sumSeasonalEnrollmentWindowView(view: SeasonalEnrollmentWindowView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedLimit + parsedSendAt + parsedWindowDays;
}
