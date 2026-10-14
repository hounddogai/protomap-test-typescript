import { ScheduledFlightScore } from "./scheduled-flight-score.js";

/** How screens and exports show a scheduled flight score. */
export class ScheduledFlightScoreView {
  code: string;
  title: string;
  approved: string;
  floorValue: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    floorValue: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFlightScoreView(item: ScheduledFlightScore): ScheduledFlightScoreView {
  return new ScheduledFlightScoreView(
    item.code,
    item.title,
    `${item.approved}`,
    item.floorValue.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFlightScoreViews(items: ScheduledFlightScore[]): ScheduledFlightScoreView[] {
  const views: ScheduledFlightScoreView[] = [];
  for (const item of items) {
    views.push(toScheduledFlightScoreView(item));
  }
  return views;
}

export function sumScheduledFlightScoreView(view: ScheduledFlightScoreView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFloorValue;
}
