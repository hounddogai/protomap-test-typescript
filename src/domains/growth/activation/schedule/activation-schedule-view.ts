import * as text from "../../../../kit/text.js";
import { ActivationSchedule } from "./activation-schedule.js";

/** How screens and exports show a activation schedule. */
export class ActivationScheduleView {
  code: string;
  labelText: string;
  budgetText: string;
  windowDays: string;
  endsAt: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budgetText: string,
    windowDays: string,
    endsAt: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budgetText = budgetText;
    this.windowDays = windowDays;
    this.endsAt = endsAt;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toActivationScheduleView(item: ActivationSchedule): ActivationScheduleView {
  return new ActivationScheduleView(
    item.code,
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    String(item.windowDays),
    String(item.endsAt),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationScheduleViews(items: ActivationSchedule[]): ActivationScheduleView[] {
  const views: ActivationScheduleView[] = [];
  for (const item of items) {
    views.push(toActivationScheduleView(item));
  }
  return views;
}

export function sumActivationScheduleView(view: ActivationScheduleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedBudget + parsedWindowDays + parsedEndsAt;
}
