import * as text from "../../../../kit/text.js";
import { PrimaryApprovalSummary } from "./primary-approval-summary.js";

/** How screens and exports show a primary approval summary. */
export class PrimaryApprovalSummaryView {
  code: string;
  label: string;
  durationMinutesText: string;
  rateText: string;
  budget: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutesText: string,
    rateText: string,
    budget: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.rateText = rateText;
    this.budget = budget;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryApprovalSummaryView(item: PrimaryApprovalSummary): PrimaryApprovalSummaryView {
  return new PrimaryApprovalSummaryView(
    item.code,
    text.truncate(item.label, 40),
    String(item.durationMinutes),
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryApprovalSummaryViews(items: PrimaryApprovalSummary[]): PrimaryApprovalSummaryView[] {
  const views: PrimaryApprovalSummaryView[] = [];
  for (const item of items) {
    views.push(toPrimaryApprovalSummaryView(item));
  }
  return views;
}

export function sumPrimaryApprovalSummaryView(view: PrimaryApprovalSummaryView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDurationMinutes + parsedRate + parsedBudget;
}
