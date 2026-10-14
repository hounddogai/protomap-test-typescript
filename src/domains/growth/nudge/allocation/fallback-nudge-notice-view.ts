import * as text from "../../../../kit/text.js";
import { FallbackNudgeNotice } from "./fallback-nudge-notice.js";

/** How screens and exports show a fallback nudge notice. */
export class FallbackNudgeNoticeView {
  code: string;
  titleText: string;
  segmentText: string;
  unit: string;
  marginText: string;
  impressions: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    segmentText: string,
    unit: string,
    marginText: string,
    impressions: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.segmentText = segmentText;
    this.unit = unit;
    this.marginText = marginText;
    this.impressions = impressions;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackNudgeNoticeView(item: FallbackNudgeNotice): FallbackNudgeNoticeView {
  return new FallbackNudgeNoticeView(
    item.code,
    item.title,
    item.segment,
    item.unit,
    item.margin.toFixed(2),
    String(item.impressions),
    text.truncate(item.phone, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackNudgeNoticeViews(items: FallbackNudgeNotice[]): FallbackNudgeNoticeView[] {
  const views: FallbackNudgeNoticeView[] = [];
  for (const item of items) {
    views.push(toFallbackNudgeNoticeView(item));
  }
  return views;
}

export function sumFallbackNudgeNoticeView(view: FallbackNudgeNoticeView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMargin + parsedImpressions;
}
