import * as text from "../../../../kit/text.js";
import { StrictCohortTemplate } from "./strict-cohort-template.js";

/** How screens and exports show a strict cohort template. */
export class StrictCohortTemplateView {
  codeText: string;
  name: string;
  visibleText: string;
  titleText: string;
  floorValue: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visibleText: string,
    titleText: string,
    floorValue: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visibleText = visibleText;
    this.titleText = titleText;
    this.floorValue = floorValue;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCohortTemplateView(item: StrictCohortTemplate): StrictCohortTemplateView {
  return new StrictCohortTemplateView(
    item.code,
    item.name,
    `${item.visible}`,
    text.truncate(item.title, 120),
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCohortTemplateViews(items: StrictCohortTemplate[]): StrictCohortTemplateView[] {
  const views: StrictCohortTemplateView[] = [];
  for (const item of items) {
    views.push(toStrictCohortTemplateView(item));
  }
  return views;
}

export function sumStrictCohortTemplateView(view: StrictCohortTemplateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFloorValue + parsedBudget;
}
