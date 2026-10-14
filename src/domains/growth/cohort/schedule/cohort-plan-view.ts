import * as text from "../../../../kit/text.js";
import { CohortPlan } from "./cohort-plan.js";

/** How screens and exports show a cohort plan. */
export class CohortPlanView {
  codeText: string;
  name: string;
  windowDaysText: string;
  source: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    windowDaysText: string,
    source: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.source = source;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toCohortPlanView(item: CohortPlan): CohortPlanView {
  return new CohortPlanView(
    item.code,
    item.name,
    String(item.windowDays),
    text.truncate(item.source, 80),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortPlanViews(items: CohortPlan[]): CohortPlanView[] {
  const views: CohortPlanView[] = [];
  for (const item of items) {
    views.push(toCohortPlanView(item));
  }
  return views;
}

export function sumCohortPlanView(view: CohortPlanView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedWindowDays + parsedConversionRate;
}
