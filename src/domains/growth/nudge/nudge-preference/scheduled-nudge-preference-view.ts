import * as text from "../../../../kit/text.js";
import { ScheduledNudgePreference } from "./scheduled-nudge-preference.js";

/** How screens and exports show a scheduled nudge preference. */
export class ScheduledNudgePreferenceView {
  code: string;
  label: string;
  weightText: string;
  amountText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weightText: string,
    amountText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weightText = weightText;
    this.amountText = amountText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledNudgePreferenceView(item: ScheduledNudgePreference): ScheduledNudgePreferenceView {
  return new ScheduledNudgePreferenceView(
    text.truncate(item.code, 64),
    item.label,
    item.weight.toFixed(2),
    item.amount.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledNudgePreferenceViews(items: ScheduledNudgePreference[]): ScheduledNudgePreferenceView[] {
  const views: ScheduledNudgePreferenceView[] = [];
  for (const item of items) {
    views.push(toScheduledNudgePreferenceView(item));
  }
  return views;
}

export function sumScheduledNudgePreferenceView(view: ScheduledNudgePreferenceView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedWeight + parsedAmount;
}
