import * as text from "../../../../kit/text.js";
import { InsightRequest } from "./insight-request.js";

/** How screens and exports show a insight request. */
export class InsightRequestView {
  code: string;
  title: string;
  windowDaysText: string;
  segmentText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDaysText: string,
    segmentText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDaysText = windowDaysText;
    this.segmentText = segmentText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toInsightRequestView(item: InsightRequest): InsightRequestView {
  return new InsightRequestView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 40),
    String(item.windowDays),
    item.segment,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightRequestViews(items: InsightRequest[]): InsightRequestView[] {
  const views: InsightRequestView[] = [];
  for (const item of items) {
    views.push(toInsightRequestView(item));
  }
  return views;
}

export function sumInsightRequestView(view: InsightRequestView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedWindowDays + parsedExpiresAt;
}
