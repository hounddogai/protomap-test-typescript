import * as text from "../../../../kit/text.js";
import { MentionNotice } from "./mention-notice.js";

/** How screens and exports show a mention notice. */
export class MentionNoticeView {
  code: string;
  label: string;
  durationMinutesText: string;
  audienceId: string;
  windowDays: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutesText: string,
    audienceId: string,
    windowDays: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toMentionNoticeView(item: MentionNotice): MentionNoticeView {
  return new MentionNoticeView(
    item.code,
    text.truncate(item.label, 64),
    String(item.durationMinutes),
    text.truncate(item.audienceId, 120),
    String(item.windowDays),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionNoticeViews(items: MentionNotice[]): MentionNoticeView[] {
  const views: MentionNoticeView[] = [];
  for (const item of items) {
    views.push(toMentionNoticeView(item));
  }
  return views;
}

export function sumMentionNoticeView(view: MentionNoticeView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedDurationMinutes + parsedWindowDays;
}
