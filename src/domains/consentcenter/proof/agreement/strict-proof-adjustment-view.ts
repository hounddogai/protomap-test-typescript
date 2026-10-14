import { StrictProofAdjustment } from "./strict-proof-adjustment.js";

/** How screens and exports show a strict proof adjustment. */
export class StrictProofAdjustmentView {
  code: string;
  title: string;
  windowDays: string;
  active: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    active: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.active = active;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictProofAdjustmentView(item: StrictProofAdjustment): StrictProofAdjustmentView {
  return new StrictProofAdjustmentView(
    item.code,
    item.title,
    String(item.windowDays),
    `${item.active}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictProofAdjustmentViews(items: StrictProofAdjustment[]): StrictProofAdjustmentView[] {
  const views: StrictProofAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictProofAdjustmentView(item));
  }
  return views;
}

export function sumStrictProofAdjustmentView(view: StrictProofAdjustmentView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedWindowDays + parsedDurationMinutes;
}
