import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutAdjustment } from "./adaptive-opt-out-adjustment.js";

/** How screens and exports show a adaptive opt out adjustment. */
export class AdaptiveOptOutAdjustmentView {
  code: string;
  titleText: string;
  ceiling: string;
  audienceId: string;
  capacity: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    audienceId: string,
    capacity: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveOptOutAdjustmentView(item: AdaptiveOptOutAdjustment): AdaptiveOptOutAdjustmentView {
  return new AdaptiveOptOutAdjustmentView(
    item.code,
    text.truncate(item.title, 64),
    item.ceiling.toFixed(2),
    item.audienceId,
    String(item.capacity),
    text.truncate(item.cohort, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveOptOutAdjustmentViews(items: AdaptiveOptOutAdjustment[]): AdaptiveOptOutAdjustmentView[] {
  const views: AdaptiveOptOutAdjustmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveOptOutAdjustmentView(item));
  }
  return views;
}

export function sumAdaptiveOptOutAdjustmentView(view: AdaptiveOptOutAdjustmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCeiling + parsedCapacity;
}
