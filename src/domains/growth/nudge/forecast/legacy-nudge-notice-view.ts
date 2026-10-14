import * as text from "../../../../kit/text.js";
import { LegacyNudgeNotice } from "./legacy-nudge-notice.js";

/** How screens and exports show a legacy nudge notice. */
export class LegacyNudgeNoticeView {
  code: string;
  labelText: string;
  conversionRateText: string;
  pinned: string;
  priorityText: string;
  channel: string;
  retries: string;
  updatedAt: string;
  version: string;
  reviewer: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    conversionRateText: string,
    pinned: string,
    priorityText: string,
    channel: string,
    retries: string,
    updatedAt: string,
    version: string,
    reviewer: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.conversionRateText = conversionRateText;
    this.pinned = pinned;
    this.priorityText = priorityText;
    this.channel = channel;
    this.retries = retries;
    this.updatedAt = updatedAt;
    this.version = version;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyNudgeNoticeView(item: LegacyNudgeNotice): LegacyNudgeNoticeView {
  return new LegacyNudgeNoticeView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    String(item.priority),
    text.truncate(item.channel, 64),
    String(item.retries),
    String(item.updatedAt),
    String(item.version),
    item.reviewer,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyNudgeNoticeViews(items: LegacyNudgeNotice[]): LegacyNudgeNoticeView[] {
  const views: LegacyNudgeNoticeView[] = [];
  for (const item of items) {
    views.push(toLegacyNudgeNoticeView(item));
  }
  return views;
}

export function sumLegacyNudgeNoticeView(view: LegacyNudgeNoticeView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedConversionRate + parsedPriority + parsedRetries;
}
