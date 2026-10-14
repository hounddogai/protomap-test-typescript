import * as text from "../../../../kit/text.js";
import { ManualEscalationSchedule } from "./manual-escalation-schedule.js";

/** How screens and exports show a manual escalation schedule. */
export class ManualEscalationScheduleView {
  codeText: string;
  title: string;
  ceilingText: string;
  phone: string;
  summary: string;
  maximum: string;
  retries: string;
  active: string;
  variant: string;
  limit: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ceilingText: string,
    phone: string,
    summary: string,
    maximum: string,
    retries: string,
    active: string,
    variant: string,
    limit: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ceilingText = ceilingText;
    this.phone = phone;
    this.summary = summary;
    this.maximum = maximum;
    this.retries = retries;
    this.active = active;
    this.variant = variant;
    this.limit = limit;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toManualEscalationScheduleView(item: ManualEscalationSchedule): ManualEscalationScheduleView {
  return new ManualEscalationScheduleView(
    item.code,
    text.truncate(item.title, 40),
    item.ceiling.toFixed(2),
    item.phone,
    item.summary,
    item.maximum.toFixed(2),
    String(item.retries),
    `${item.active}`,
    text.truncate(item.variant, 80),
    String(item.limit),
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEscalationScheduleViews(items: ManualEscalationSchedule[]): ManualEscalationScheduleView[] {
  const views: ManualEscalationScheduleView[] = [];
  for (const item of items) {
    views.push(toManualEscalationScheduleView(item));
  }
  return views;
}

export function sumManualEscalationScheduleView(view: ManualEscalationScheduleView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCeiling + parsedMaximum + parsedRetries;
}
