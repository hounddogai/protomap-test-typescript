import * as text from "../../../../kit/text.js";
import { AdaptiveBranchSummary } from "./adaptive-branch-summary.js";

/** How screens and exports show a adaptive branch summary. */
export class AdaptiveBranchSummaryView {
  code: string;
  label: string;
  unitText: string;
  windowDays: string;
  notesText: string;
  ceiling: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unitText: string,
    windowDays: string,
    notesText: string,
    ceiling: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unitText = unitText;
    this.windowDays = windowDays;
    this.notesText = notesText;
    this.ceiling = ceiling;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBranchSummaryView(item: AdaptiveBranchSummary): AdaptiveBranchSummaryView {
  return new AdaptiveBranchSummaryView(
    item.code,
    item.label,
    text.truncate(item.unit, 40),
    String(item.windowDays),
    item.notes,
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBranchSummaryViews(items: AdaptiveBranchSummary[]): AdaptiveBranchSummaryView[] {
  const views: AdaptiveBranchSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBranchSummaryView(item));
  }
  return views;
}

export function sumAdaptiveBranchSummaryView(view: AdaptiveBranchSummaryView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedWindowDays + parsedCeiling + parsedBudget;
}
