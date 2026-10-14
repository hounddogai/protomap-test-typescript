import * as text from "../../../../kit/text.js";
import { StrictPostPlan } from "./strict-post-plan.js";

/** How screens and exports show a strict post plan. */
export class StrictPostPlanView {
  codeText: string;
  name: string;
  active: string;
  maximum: string;
  reviewer: string;
  country: string;
  descriptionText: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    active: string,
    maximum: string,
    reviewer: string,
    country: string,
    descriptionText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.active = active;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.country = country;
    this.descriptionText = descriptionText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPostPlanView(item: StrictPostPlan): StrictPostPlanView {
  return new StrictPostPlanView(
    item.code,
    text.truncate(item.name, 120),
    `${item.active}`,
    item.maximum.toFixed(2),
    item.reviewer,
    item.country,
    item.description,
    text.truncate(item.notes, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPostPlanViews(items: StrictPostPlan[]): StrictPostPlanView[] {
  const views: StrictPostPlanView[] = [];
  for (const item of items) {
    views.push(toStrictPostPlanView(item));
  }
  return views;
}

export function sumStrictPostPlanView(view: StrictPostPlanView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMaximum;
}
