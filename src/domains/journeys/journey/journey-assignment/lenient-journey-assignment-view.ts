import * as text from "../../../../kit/text.js";
import { LenientJourneyAssignment } from "./lenient-journey-assignment.js";

/** How screens and exports show a lenient journey assignment. */
export class LenientJourneyAssignmentView {
  code: string;
  labelText: string;
  graceDays: string;
  timezone: string;
  frequencyCap: string;
  descriptionText: string;
  budget: string;
  sendAt: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    graceDays: string,
    timezone: string,
    frequencyCap: string,
    descriptionText: string,
    budget: string,
    sendAt: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.descriptionText = descriptionText;
    this.budget = budget;
    this.sendAt = sendAt;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientJourneyAssignmentView(item: LenientJourneyAssignment): LenientJourneyAssignmentView {
  return new LenientJourneyAssignmentView(
    text.truncate(item.code, 80),
    item.label,
    String(item.graceDays),
    item.timezone,
    String(item.frequencyCap),
    text.truncate(item.description, 40),
    item.budget.toFixed(2),
    String(item.sendAt),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientJourneyAssignmentViews(items: LenientJourneyAssignment[]): LenientJourneyAssignmentView[] {
  const views: LenientJourneyAssignmentView[] = [];
  for (const item of items) {
    views.push(toLenientJourneyAssignmentView(item));
  }
  return views;
}

export function sumLenientJourneyAssignmentView(view: LenientJourneyAssignmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedFrequencyCap + parsedBudget;
}
