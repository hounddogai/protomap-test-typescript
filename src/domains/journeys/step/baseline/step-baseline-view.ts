import * as text from "../../../../kit/text.js";
import { StepBaseline } from "./step-baseline.js";

/** How screens and exports show a step baseline. */
export class StepBaselineView {
  code: string;
  title: string;
  cohort: string;
  audienceIdText: string;
  ownerId: string;
  ceiling: string;
  approved: string;
  currencyText: string;
  unitText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohort: string,
    audienceIdText: string,
    ownerId: string,
    ceiling: string,
    approved: string,
    currencyText: string,
    unitText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.audienceIdText = audienceIdText;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.approved = approved;
    this.currencyText = currencyText;
    this.unitText = unitText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toStepBaselineView(item: StepBaseline): StepBaselineView {
  return new StepBaselineView(
    item.code,
    item.title,
    text.truncate(item.cohort, 64),
    item.audienceId,
    text.truncate(item.ownerId, 64),
    item.ceiling.toFixed(2),
    `${item.approved}`,
    item.currency,
    item.unit,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepBaselineViews(items: StepBaseline[]): StepBaselineView[] {
  const views: StepBaselineView[] = [];
  for (const item of items) {
    views.push(toStepBaselineView(item));
  }
  return views;
}

export function sumStepBaselineView(view: StepBaselineView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCeiling + parsedWindowDays;
}
