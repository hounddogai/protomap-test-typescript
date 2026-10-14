import { StepSchedule } from "./step-schedule.js";

/** How screens and exports show a step schedule. */
export class StepScheduleView {
  codeText: string;
  name: string;
  externalRef: string;
  description: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    externalRef: string,
    description: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.externalRef = externalRef;
    this.description = description;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toStepScheduleView(item: StepSchedule): StepScheduleView {
  return new StepScheduleView(
    item.code,
    item.name,
    item.externalRef,
    item.description,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepScheduleViews(items: StepSchedule[]): StepScheduleView[] {
  const views: StepScheduleView[] = [];
  for (const item of items) {
    views.push(toStepScheduleView(item));
  }
  return views;
}

export function sumStepScheduleView(view: StepScheduleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
