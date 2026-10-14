import * as text from "../../../../kit/text.js";
import { CappedCohortSchedule } from "./capped-cohort-schedule.js";

/** How screens and exports show a capped cohort schedule. */
export class CappedCohortScheduleView {
  code: string;
  nameText: string;
  cohort: string;
  currencyText: string;
  budgetText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    cohort: string,
    currencyText: string,
    budgetText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.cohort = cohort;
    this.currencyText = currencyText;
    this.budgetText = budgetText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCohortScheduleView(item: CappedCohortSchedule): CappedCohortScheduleView {
  return new CappedCohortScheduleView(
    item.code,
    item.name,
    item.cohort,
    text.truncate(item.currency, 80),
    item.budget.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCohortScheduleViews(items: CappedCohortSchedule[]): CappedCohortScheduleView[] {
  const views: CappedCohortScheduleView[] = [];
  for (const item of items) {
    views.push(toCappedCohortScheduleView(item));
  }
  return views;
}

export function sumCappedCohortScheduleView(view: CappedCohortScheduleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
