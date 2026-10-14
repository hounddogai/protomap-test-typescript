import * as text from "../../../../kit/text.js";
import { BatchedEscalationNotice } from "./batched-escalation-notice.js";

/** How screens and exports show a batched escalation notice. */
export class BatchedEscalationNoticeView {
  code: string;
  label: string;
  margin: string;
  name: string;
  durationMinutes: string;
  channel: string;
  locale: string;
  country: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    name: string,
    durationMinutes: string,
    channel: string,
    locale: string,
    country: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.locale = locale;
    this.country = country;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedEscalationNoticeView(item: BatchedEscalationNotice): BatchedEscalationNoticeView {
  return new BatchedEscalationNoticeView(
    text.truncate(item.code, 80),
    item.label,
    item.margin.toFixed(2),
    item.name,
    String(item.durationMinutes),
    text.truncate(item.channel, 120),
    text.truncate(item.locale, 80),
    text.truncate(item.country, 80),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedEscalationNoticeViews(items: BatchedEscalationNotice[]): BatchedEscalationNoticeView[] {
  const views: BatchedEscalationNoticeView[] = [];
  for (const item of items) {
    views.push(toBatchedEscalationNoticeView(item));
  }
  return views;
}

export function sumBatchedEscalationNoticeView(view: BatchedEscalationNoticeView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMargin + parsedDurationMinutes;
}
