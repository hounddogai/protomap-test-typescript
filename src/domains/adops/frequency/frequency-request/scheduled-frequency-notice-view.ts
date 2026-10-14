import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

/** How screens and exports show a scheduled frequency notice. */
export class ScheduledFrequencyNoticeView {
  code: string;
  label: string;
  currencyText: string;
  sourceText: string;
  impressions: string;
  notes: string;
  expiresAt: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currencyText: string,
    sourceText: string,
    impressions: string,
    notes: string,
    expiresAt: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currencyText = currencyText;
    this.sourceText = sourceText;
    this.impressions = impressions;
    this.notes = notes;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFrequencyNoticeView(item: ScheduledFrequencyNotice): ScheduledFrequencyNoticeView {
  return new ScheduledFrequencyNoticeView(
    text.truncate(item.code, 64),
    item.label,
    item.currency,
    item.source,
    String(item.impressions),
    text.truncate(item.notes, 40),
    String(item.expiresAt),
    text.truncate(item.summary, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFrequencyNoticeViews(items: ScheduledFrequencyNotice[]): ScheduledFrequencyNoticeView[] {
  const views: ScheduledFrequencyNoticeView[] = [];
  for (const item of items) {
    views.push(toScheduledFrequencyNoticeView(item));
  }
  return views;
}

export function sumScheduledFrequencyNoticeView(view: ScheduledFrequencyNoticeView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedImpressions + parsedExpiresAt;
}
