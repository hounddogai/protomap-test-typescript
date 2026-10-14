import * as text from "../../../../kit/text.js";
import { LegacyInsightSegment } from "./legacy-insight-segment.js";

/** How screens and exports show a legacy insight segment. */
export class LegacyInsightSegmentView {
  code: string;
  title: string;
  windowDays: string;
  journeyId: string;
  localeText: string;
  expiresAtText: string;
  timezone: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    journeyId: string,
    localeText: string,
    expiresAtText: string,
    timezone: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.localeText = localeText;
    this.expiresAtText = expiresAtText;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInsightSegmentView(item: LegacyInsightSegment): LegacyInsightSegmentView {
  return new LegacyInsightSegmentView(
    item.code,
    item.title,
    String(item.windowDays),
    item.journeyId,
    text.truncate(item.locale, 40),
    String(item.expiresAt),
    item.timezone,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInsightSegmentViews(items: LegacyInsightSegment[]): LegacyInsightSegmentView[] {
  const views: LegacyInsightSegmentView[] = [];
  for (const item of items) {
    views.push(toLegacyInsightSegmentView(item));
  }
  return views;
}

export function sumLegacyInsightSegmentView(view: LegacyInsightSegmentView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedWindowDays + parsedExpiresAt;
}
