import * as text from "../../../../kit/text.js";
import { ScheduledCohortException } from "./scheduled-cohort-exception.js";

/** How screens and exports show a scheduled cohort exception. */
export class ScheduledCohortExceptionView {
  code: string;
  nameText: string;
  rate: string;
  endsAt: string;
  channel: string;
  description: string;
  active: string;
  maximum: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    rate: string,
    endsAt: string,
    channel: string,
    description: string,
    active: string,
    maximum: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.rate = rate;
    this.endsAt = endsAt;
    this.channel = channel;
    this.description = description;
    this.active = active;
    this.maximum = maximum;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCohortExceptionView(item: ScheduledCohortException): ScheduledCohortExceptionView {
  return new ScheduledCohortExceptionView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    String(item.endsAt),
    item.channel,
    text.truncate(item.description, 64),
    `${item.active}`,
    item.maximum.toFixed(2),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCohortExceptionViews(items: ScheduledCohortException[]): ScheduledCohortExceptionView[] {
  const views: ScheduledCohortExceptionView[] = [];
  for (const item of items) {
    views.push(toScheduledCohortExceptionView(item));
  }
  return views;
}

export function sumScheduledCohortExceptionView(view: ScheduledCohortExceptionView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRate + parsedEndsAt + parsedMaximum;
}
