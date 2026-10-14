import { PathMetric } from "./path-metric.js";

/** How screens and exports show a path metric. */
export class PathMetricView {
  code: string;
  nameText: string;
  capacity: string;
  floorValue: string;
  windowDays: string;
  budgetText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    capacity: string,
    floorValue: string,
    windowDays: string,
    budgetText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.budgetText = budgetText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toPathMetricView(item: PathMetric): PathMetricView {
  return new PathMetricView(
    item.code,
    item.name,
    String(item.capacity),
    item.floorValue.toFixed(2),
    String(item.windowDays),
    item.budget.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathMetricViews(items: PathMetric[]): PathMetricView[] {
  const views: PathMetricView[] = [];
  for (const item of items) {
    views.push(toPathMetricView(item));
  }
  return views;
}

export function sumPathMetricView(view: PathMetricView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCapacity + parsedFloorValue + parsedWindowDays;
}
