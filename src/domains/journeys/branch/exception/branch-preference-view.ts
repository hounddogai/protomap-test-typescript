import * as text from "../../../../kit/text.js";
import { BranchPreference } from "./branch-preference.js";

/** How screens and exports show a branch preference. */
export class BranchPreferenceView {
  code: string;
  name: string;
  rateText: string;
  contactEmail: string;
  notes: string;
  archived: string;
  graceDaysText: string;
  budget: string;
  floorValue: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rateText: string,
    contactEmail: string,
    notes: string,
    archived: string,
    graceDaysText: string,
    budget: string,
    floorValue: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rateText = rateText;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.archived = archived;
    this.graceDaysText = graceDaysText;
    this.budget = budget;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toBranchPreferenceView(item: BranchPreference): BranchPreferenceView {
  return new BranchPreferenceView(
    item.code,
    text.truncate(item.name, 80),
    item.rate.toFixed(2),
    text.truncate(item.contactEmail, 64),
    item.notes,
    `${item.archived}`,
    String(item.graceDays),
    item.budget.toFixed(2),
    item.floorValue.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchPreferenceViews(items: BranchPreference[]): BranchPreferenceView[] {
  const views: BranchPreferenceView[] = [];
  for (const item of items) {
    views.push(toBranchPreferenceView(item));
  }
  return views;
}

export function sumBranchPreferenceView(view: BranchPreferenceView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRate + parsedGraceDays + parsedBudget;
}
