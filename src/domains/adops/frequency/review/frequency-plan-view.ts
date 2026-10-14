import * as text from "../../../../kit/text.js";
import { FrequencyPlan } from "./frequency-plan.js";

/** How screens and exports show a frequency plan. */
export class FrequencyPlanView {
  codeText: string;
  titleText: string;
  cohortText: string;
  notes: string;
  localeText: string;
  budget: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    cohortText: string,
    notes: string,
    localeText: string,
    budget: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.cohortText = cohortText;
    this.notes = notes;
    this.localeText = localeText;
    this.budget = budget;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyPlanView(item: FrequencyPlan): FrequencyPlanView {
  return new FrequencyPlanView(
    item.code,
    item.title,
    text.truncate(item.cohort, 80),
    item.notes,
    text.truncate(item.locale, 80),
    item.budget.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyPlanViews(items: FrequencyPlan[]): FrequencyPlanView[] {
  const views: FrequencyPlanView[] = [];
  for (const item of items) {
    views.push(toFrequencyPlanView(item));
  }
  return views;
}

export function sumFrequencyPlanView(view: FrequencyPlanView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBudget + parsedRatio;
}
