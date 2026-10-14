import * as text from "../../../../kit/text.js";
import { RollingOptOutException } from "./rolling-opt-out-exception.js";

/** How screens and exports show a rolling opt out exception. */
export class RollingOptOutExceptionView {
  code: string;
  title: string;
  budget: string;
  phone: string;
  externalRefText: string;
  cohort: string;
  activeText: string;
  openRate: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    phone: string,
    externalRefText: string,
    cohort: string,
    activeText: string,
    openRate: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.phone = phone;
    this.externalRefText = externalRefText;
    this.cohort = cohort;
    this.activeText = activeText;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toRollingOptOutExceptionView(item: RollingOptOutException): RollingOptOutExceptionView {
  return new RollingOptOutExceptionView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    item.budget.toFixed(2),
    item.phone,
    item.externalRef,
    item.cohort,
    `${item.active}`,
    item.openRate.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingOptOutExceptionViews(items: RollingOptOutException[]): RollingOptOutExceptionView[] {
  const views: RollingOptOutExceptionView[] = [];
  for (const item of items) {
    views.push(toRollingOptOutExceptionView(item));
  }
  return views;
}

export function sumRollingOptOutExceptionView(view: RollingOptOutExceptionView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBudget + parsedOpenRate + parsedCreatedAt;
}
