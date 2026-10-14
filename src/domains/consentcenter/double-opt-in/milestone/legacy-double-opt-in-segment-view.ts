import { LegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

/** How screens and exports show a legacy double opt in segment. */
export class LegacyDoubleOptInSegmentView {
  code: string;
  title: string;
  conversionRate: string;
  windowDays: string;
  durationMinutes: string;
  updatedAtText: string;
  attempts: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    conversionRate: string,
    windowDays: string,
    durationMinutes: string,
    updatedAtText: string,
    attempts: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.updatedAtText = updatedAtText;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDoubleOptInSegmentView(item: LegacyDoubleOptInSegment): LegacyDoubleOptInSegmentView {
  return new LegacyDoubleOptInSegmentView(
    item.code,
    item.title,
    item.conversionRate.toFixed(2),
    String(item.windowDays),
    String(item.durationMinutes),
    String(item.updatedAt),
    String(item.attempts),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDoubleOptInSegmentViews(items: LegacyDoubleOptInSegment[]): LegacyDoubleOptInSegmentView[] {
  const views: LegacyDoubleOptInSegmentView[] = [];
  for (const item of items) {
    views.push(toLegacyDoubleOptInSegmentView(item));
  }
  return views;
}

export function sumLegacyDoubleOptInSegmentView(view: LegacyDoubleOptInSegmentView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedConversionRate + parsedWindowDays + parsedDurationMinutes;
}
