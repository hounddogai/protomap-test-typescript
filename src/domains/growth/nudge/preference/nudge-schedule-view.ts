import * as text from "../../../../kit/text.js";
import { NudgeSchedule } from "./nudge-schedule.js";

/** How screens and exports show a nudge schedule. */
export class NudgeScheduleView {
  code: string;
  label: string;
  endsAtText: string;
  unit: string;
  country: string;
  variant: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAtText: string,
    unit: string,
    country: string,
    variant: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAtText = endsAtText;
    this.unit = unit;
    this.country = country;
    this.variant = variant;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeScheduleView(item: NudgeSchedule): NudgeScheduleView {
  return new NudgeScheduleView(
    text.truncate(item.code, 64),
    item.label,
    String(item.endsAt),
    item.unit,
    item.country,
    item.variant,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeScheduleViews(items: NudgeSchedule[]): NudgeScheduleView[] {
  const views: NudgeScheduleView[] = [];
  for (const item of items) {
    views.push(toNudgeScheduleView(item));
  }
  return views;
}

export function sumNudgeScheduleView(view: NudgeScheduleView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedEndsAt + parsedFloorValue;
}
