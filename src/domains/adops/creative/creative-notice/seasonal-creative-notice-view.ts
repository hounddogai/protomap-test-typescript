import { SeasonalCreativeNotice } from "./seasonal-creative-notice.js";

/** How screens and exports show a seasonal creative notice. */
export class SeasonalCreativeNoticeView {
  code: string;
  name: string;
  maximum: string;
  priority: string;
  floorValue: string;
  frequencyCap: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    maximum: string,
    priority: string,
    floorValue: string,
    frequencyCap: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.priority = priority;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCreativeNoticeView(item: SeasonalCreativeNotice): SeasonalCreativeNoticeView {
  return new SeasonalCreativeNoticeView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    String(item.priority),
    item.floorValue.toFixed(2),
    String(item.frequencyCap),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCreativeNoticeViews(items: SeasonalCreativeNotice[]): SeasonalCreativeNoticeView[] {
  const views: SeasonalCreativeNoticeView[] = [];
  for (const item of items) {
    views.push(toSeasonalCreativeNoticeView(item));
  }
  return views;
}

export function sumSeasonalCreativeNoticeView(view: SeasonalCreativeNoticeView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedMaximum + parsedPriority + parsedFloorValue;
}
