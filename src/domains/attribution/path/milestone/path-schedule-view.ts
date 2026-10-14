import { PathSchedule } from "./path-schedule.js";

/** How screens and exports show a path schedule. */
export class PathScheduleView {
  code: string;
  name: string;
  cohort: string;
  sequence: string;
  endsAt: string;
  approved: string;
  capacityText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    sequence: string,
    endsAt: string,
    approved: string,
    capacityText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.approved = approved;
    this.capacityText = capacityText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toPathScheduleView(item: PathSchedule): PathScheduleView {
  return new PathScheduleView(
    item.code,
    item.name,
    item.cohort,
    String(item.sequence),
    String(item.endsAt),
    `${item.approved}`,
    String(item.capacity),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathScheduleViews(items: PathSchedule[]): PathScheduleView[] {
  const views: PathScheduleView[] = [];
  for (const item of items) {
    views.push(toPathScheduleView(item));
  }
  return views;
}

export function sumPathScheduleView(view: PathScheduleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedSequence + parsedEndsAt + parsedCapacity;
}
