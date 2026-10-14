import * as text from "../../../../kit/text.js";
import { FallbackCreditSchedule } from "./fallback-credit-schedule.js";

/** How screens and exports show a fallback credit schedule. */
export class FallbackCreditScheduleView {
  codeText: string;
  label: string;
  createdAt: string;
  phone: string;
  unit: string;
  segment: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    createdAt: string,
    phone: string,
    unit: string,
    segment: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.createdAt = createdAt;
    this.phone = phone;
    this.unit = unit;
    this.segment = segment;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditScheduleView(item: FallbackCreditSchedule): FallbackCreditScheduleView {
  return new FallbackCreditScheduleView(
    item.code,
    text.truncate(item.label, 80),
    String(item.createdAt),
    item.phone,
    item.unit,
    item.segment,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditScheduleViews(items: FallbackCreditSchedule[]): FallbackCreditScheduleView[] {
  const views: FallbackCreditScheduleView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditScheduleView(item));
  }
  return views;
}

export function sumFallbackCreditScheduleView(view: FallbackCreditScheduleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCreatedAt + parsedRate;
}
