import * as text from "../../../../kit/text.js";
import { WeightedStepSchedule } from "./weighted-step-schedule.js";

/** How screens and exports show a weighted step schedule. */
export class WeightedStepScheduleView {
  code: string;
  titleText: string;
  revision: string;
  graceDays: string;
  currency: string;
  ceiling: string;
  source: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    graceDays: string,
    currency: string,
    ceiling: string,
    source: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.graceDays = graceDays;
    this.currency = currency;
    this.ceiling = ceiling;
    this.source = source;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedStepScheduleView(item: WeightedStepSchedule): WeightedStepScheduleView {
  return new WeightedStepScheduleView(
    item.code,
    item.title,
    String(item.revision),
    String(item.graceDays),
    text.truncate(item.currency, 80),
    item.ceiling.toFixed(2),
    text.truncate(item.source, 80),
    text.truncate(item.name, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedStepScheduleViews(items: WeightedStepSchedule[]): WeightedStepScheduleView[] {
  const views: WeightedStepScheduleView[] = [];
  for (const item of items) {
    views.push(toWeightedStepScheduleView(item));
  }
  return views;
}

export function sumWeightedStepScheduleView(view: WeightedStepScheduleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRevision + parsedGraceDays + parsedCeiling;
}
