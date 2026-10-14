import * as text from "../../../../kit/text.js";
import { ScheduledWindowNotice } from "./scheduled-window-notice.js";

/** How screens and exports show a scheduled window notice. */
export class ScheduledWindowNoticeView {
  codeText: string;
  label: string;
  name: string;
  externalRef: string;
  region: string;
  contactEmail: string;
  graceDays: string;
  ceiling: string;
  budget: string;
  startsAtText: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    name: string,
    externalRef: string,
    region: string,
    contactEmail: string,
    graceDays: string,
    ceiling: string,
    budget: string,
    startsAtText: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.name = name;
    this.externalRef = externalRef;
    this.region = region;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
    this.budget = budget;
    this.startsAtText = startsAtText;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWindowNoticeView(item: ScheduledWindowNotice): ScheduledWindowNoticeView {
  return new ScheduledWindowNoticeView(
    item.code,
    item.label,
    text.truncate(item.name, 64),
    item.externalRef,
    item.region,
    item.contactEmail,
    String(item.graceDays),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    String(item.startsAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWindowNoticeViews(items: ScheduledWindowNotice[]): ScheduledWindowNoticeView[] {
  const views: ScheduledWindowNoticeView[] = [];
  for (const item of items) {
    views.push(toScheduledWindowNoticeView(item));
  }
  return views;
}

export function sumScheduledWindowNoticeView(view: ScheduledWindowNoticeView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedCeiling + parsedBudget;
}
