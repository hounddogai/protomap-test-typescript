import * as text from "../../../../kit/text.js";
import { CappedModelGroup } from "./capped-model-group.js";

/** How screens and exports show a capped model group. */
export class CappedModelGroupView {
  code: string;
  labelText: string;
  active: string;
  windowDaysText: string;
  unit: string;
  reviewer: string;
  retries: string;
  variantText: string;
  cohort: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    active: string,
    windowDaysText: string,
    unit: string,
    reviewer: string,
    retries: string,
    variantText: string,
    cohort: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.active = active;
    this.windowDaysText = windowDaysText;
    this.unit = unit;
    this.reviewer = reviewer;
    this.retries = retries;
    this.variantText = variantText;
    this.cohort = cohort;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedModelGroupView(item: CappedModelGroup): CappedModelGroupView {
  return new CappedModelGroupView(
    item.code,
    item.label,
    `${item.active}`,
    String(item.windowDays),
    item.unit,
    item.reviewer,
    String(item.retries),
    item.variant,
    text.truncate(item.cohort, 120),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedModelGroupViews(items: CappedModelGroup[]): CappedModelGroupView[] {
  const views: CappedModelGroupView[] = [];
  for (const item of items) {
    views.push(toCappedModelGroupView(item));
  }
  return views;
}

export function sumCappedModelGroupView(view: CappedModelGroupView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedWindowDays + parsedRetries + parsedStartsAt;
}
