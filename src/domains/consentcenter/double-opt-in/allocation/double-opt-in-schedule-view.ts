import { DoubleOptInSchedule } from "./double-opt-in-schedule.js";

/** How screens and exports show a double opt in schedule. */
export class DoubleOptInScheduleView {
  code: string;
  labelText: string;
  ownerId: string;
  titleText: string;
  ratioText: string;
  variant: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ownerId: string,
    titleText: string,
    ratioText: string,
    variant: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ownerId = ownerId;
    this.titleText = titleText;
    this.ratioText = ratioText;
    this.variant = variant;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInScheduleView(item: DoubleOptInSchedule): DoubleOptInScheduleView {
  return new DoubleOptInScheduleView(
    item.code,
    item.label,
    item.ownerId,
    item.title,
    item.ratio.toFixed(2),
    item.variant,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInScheduleViews(items: DoubleOptInSchedule[]): DoubleOptInScheduleView[] {
  const views: DoubleOptInScheduleView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInScheduleView(item));
  }
  return views;
}

export function sumDoubleOptInScheduleView(view: DoubleOptInScheduleView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedRatio + parsedGraceDays;
}
