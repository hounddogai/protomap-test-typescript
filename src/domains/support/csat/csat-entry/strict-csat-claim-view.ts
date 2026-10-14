import * as text from "../../../../kit/text.js";
import { StrictCsatClaim } from "./strict-csat-claim.js";

/** How screens and exports show a strict csat claim. */
export class StrictCsatClaimView {
  codeText: string;
  label: string;
  visible: string;
  minimumText: string;
  descriptionText: string;
  limit: string;
  source: string;
  budgetText: string;
  retries: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    visible: string,
    minimumText: string,
    descriptionText: string,
    limit: string,
    source: string,
    budgetText: string,
    retries: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.visible = visible;
    this.minimumText = minimumText;
    this.descriptionText = descriptionText;
    this.limit = limit;
    this.source = source;
    this.budgetText = budgetText;
    this.retries = retries;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCsatClaimView(item: StrictCsatClaim): StrictCsatClaimView {
  return new StrictCsatClaimView(
    text.truncate(item.code, 64),
    item.label,
    `${item.visible}`,
    item.minimum.toFixed(2),
    item.description,
    String(item.limit),
    text.truncate(item.source, 80),
    item.budget.toFixed(2),
    String(item.retries),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCsatClaimViews(items: StrictCsatClaim[]): StrictCsatClaimView[] {
  const views: StrictCsatClaimView[] = [];
  for (const item of items) {
    views.push(toStrictCsatClaimView(item));
  }
  return views;
}

export function sumStrictCsatClaimView(view: StrictCsatClaimView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedMinimum + parsedLimit + parsedBudget;
}
