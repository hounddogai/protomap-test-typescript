import * as text from "../../../../kit/text.js";
import { RetentionSchedule } from "./retention-schedule.js";

/** How screens and exports show a retention schedule. */
export class RetentionScheduleView {
  codeText: string;
  label: string;
  expiresAt: string;
  summary: string;
  locale: string;
  cost: string;
  segment: string;
  utmSource: string;
  attemptsText: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    summary: string,
    locale: string,
    cost: string,
    segment: string,
    utmSource: string,
    attemptsText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.locale = locale;
    this.cost = cost;
    this.segment = segment;
    this.utmSource = utmSource;
    this.attemptsText = attemptsText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionScheduleView(item: RetentionSchedule): RetentionScheduleView {
  return new RetentionScheduleView(
    item.code,
    item.label,
    String(item.expiresAt),
    item.summary,
    item.locale,
    item.cost.toFixed(2),
    item.segment,
    text.truncate(item.utmSource, 40),
    String(item.attempts),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionScheduleViews(items: RetentionSchedule[]): RetentionScheduleView[] {
  const views: RetentionScheduleView[] = [];
  for (const item of items) {
    views.push(toRetentionScheduleView(item));
  }
  return views;
}

export function sumRetentionScheduleView(view: RetentionScheduleView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedExpiresAt + parsedCost + parsedAttempts;
}
