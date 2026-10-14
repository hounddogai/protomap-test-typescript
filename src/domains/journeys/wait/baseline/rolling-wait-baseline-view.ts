import * as text from "../../../../kit/text.js";
import { RollingWaitBaseline } from "./rolling-wait-baseline.js";

/** How screens and exports show a rolling wait baseline. */
export class RollingWaitBaselineView {
  code: string;
  name: string;
  localeText: string;
  minimumText: string;
  endsAtText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    minimumText: string,
    endsAtText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.minimumText = minimumText;
    this.endsAtText = endsAtText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWaitBaselineView(item: RollingWaitBaseline): RollingWaitBaselineView {
  return new RollingWaitBaselineView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.locale, 40),
    item.minimum.toFixed(2),
    String(item.endsAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWaitBaselineViews(items: RollingWaitBaseline[]): RollingWaitBaselineView[] {
  const views: RollingWaitBaselineView[] = [];
  for (const item of items) {
    views.push(toRollingWaitBaselineView(item));
  }
  return views;
}

export function sumRollingWaitBaselineView(view: RollingWaitBaselineView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedMinimum + parsedEndsAt + parsedCapacity;
}
