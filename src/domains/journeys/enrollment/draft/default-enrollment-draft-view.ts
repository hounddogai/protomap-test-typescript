import { DefaultEnrollmentDraft } from "./default-enrollment-draft.js";

/** How screens and exports show a default enrollment draft. */
export class DefaultEnrollmentDraftView {
  code: string;
  label: string;
  budget: string;
  activeText: string;
  durationMinutes: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    activeText: string,
    durationMinutes: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.activeText = activeText;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultEnrollmentDraftView(item: DefaultEnrollmentDraft): DefaultEnrollmentDraftView {
  return new DefaultEnrollmentDraftView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    `${item.active}`,
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultEnrollmentDraftViews(items: DefaultEnrollmentDraft[]): DefaultEnrollmentDraftView[] {
  const views: DefaultEnrollmentDraftView[] = [];
  for (const item of items) {
    views.push(toDefaultEnrollmentDraftView(item));
  }
  return views;
}

export function sumDefaultEnrollmentDraftView(view: DefaultEnrollmentDraftView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedBudget + parsedDurationMinutes + parsedMinimum;
}
